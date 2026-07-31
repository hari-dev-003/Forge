import sanitizeHtml from 'sanitize-html';
import { announcementRepo } from '../repositories/announcementRepo.js';
import { auditRepo } from '../repositories/auditRepo.js';
import { newId } from '../lib/ids.js';
import { withAttachmentUrls, withListAttachmentUrls } from './announcementUrls.js';
import { assertUploadedImages, isImageContentType } from './uploadGuards.js';
import { ROLES, ANNOUNCEMENT_STATUS, MAX_PINNED_ANNOUNCEMENTS } from '../config/constants.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../lib/errors.js';

const SANITIZE_OPTIONS = {
  allowedTags: ['p', 'br', 'b', 'strong', 'i', 'em', 'ul', 'ol', 'li', 'a'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  // Force safe link behaviour regardless of what the editor produced.
  transformTags: { a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }) },
};

/**
 * Effective visibility, computed at read time (lazy — no cron/background job
 * exists in this codebase). DRAFT is never visible to a viewer. SCHEDULED
 * becomes visible once publishDate has passed; PUBLISHED hides once expiryDate
 * has passed.
 */
function isEffectivelyVisible(a, now = Date.now()) {
  if (a.status === ANNOUNCEMENT_STATUS.DRAFT) return false;
  if (a.publishDate && new Date(a.publishDate).getTime() > now) return false;
  if (a.expiryDate && new Date(a.expiryDate).getTime() < now) return false;
  return true;
}

function canViewerSee(a, user) {
  if (!isEffectivelyVisible(a)) return false;
  const targets = a.targetRoles?.length ? a.targetRoles : [ROLES.MANAGER, ROLES.USER];
  return targets.includes(user.role);
}

/**
 * When an announcement is considered "posted": its publish date (the moment it
 * goes live) with the upload/creation time as the fallback and tiebreaker, so
 * two items published in the same instant still order deterministically.
 */
function postedAt(a) {
  const t = Date.parse(a?.publishDate ?? '');
  if (!Number.isNaN(t)) return t;
  const c = Date.parse(a?.createdAt ?? '');
  return Number.isNaN(c) ? 0 : c;
}

const byNewest = (a, b) => postedAt(b) - postedAt(a) || String(b.id).localeCompare(String(a.id));

const SORTERS = {
  latest: byNewest,
  oldest: (a, b) => -byNewest(a, b),
  mostViewed: (a, b) => (b.viewCount || 0) - (a.viewCount || 0) || byNewest(a, b),
};

/**
 * The canonical feed order everywhere (admin table, Manager feed, User feed):
 * pinned announcements first, then everything else, each group ordered by the
 * requested sort — newest upload first by default.
 */
export function orderAnnouncements(items, sort = 'latest') {
  const sorter = SORTERS[sort] || SORTERS.latest;
  const pinned = items.filter((a) => a.isPinned).sort(sorter);
  const rest = items.filter((a) => !a.isPinned).sort(sorter);
  return [...pinned, ...rest];
}

/**
 * Reject a pin that would exceed the cap.
 *
 * Counts every pinned announcement regardless of status: a pinned DRAFT claims
 * its slot the moment it publishes, so letting it slip past here would just
 * move the failure to a later, more confusing moment. `exceptId` lets an edit
 * of an already-pinned announcement re-save without counting itself.
 */
async function assertPinCapacity(exceptId = null) {
  const all = await announcementRepo.listAll();
  const pinned = all.filter((a) => a.isPinned && a.id !== exceptId);
  if (pinned.length >= MAX_PINNED_ANNOUNCEMENTS) {
    throw new BadRequestError(
      `Only ${MAX_PINNED_ANNOUNCEMENTS} announcements can be pinned at once — unpin one first.`
    );
  }
}

/**
 * Hold announcement image attachments to the same size cap as every other
 * image in the product. Only images are checked: documents (PDF/PPT/DOC/ZIP)
 * are legitimately larger and are governed by the attachment limit in the
 * upload UI, not by the image rule.
 */
async function assertAttachmentImages(attachments = []) {
  const images = attachments
    .filter((a) => a?.key && isImageContentType(a.contentType))
    .map((a) => ({ key: a.key, label: `"${a.fileName || 'Image'}"` }));
  if (images.length) await assertUploadedImages(images);
}

export const announcementService = {
  async create(actor, dto) {
    if (actor.role !== ROLES.ADMIN) throw new ForbiddenError('Only admins can create announcements');

    const now = new Date().toISOString();
    // Client sends the admin's intent (DRAFT / PUBLISH_NOW / SCHEDULE) — map
    // to the stored status enum.
    const STATUS_INTENT = {
      DRAFT: ANNOUNCEMENT_STATUS.DRAFT,
      PUBLISH_NOW: ANNOUNCEMENT_STATUS.PUBLISHED,
      SCHEDULE: ANNOUNCEMENT_STATUS.SCHEDULED,
    };
    const status = STATUS_INTENT[dto.status] || ANNOUNCEMENT_STATUS.PUBLISHED;
    if (status === ANNOUNCEMENT_STATUS.SCHEDULED && !dto.publishDate) {
      throw new BadRequestError('A publish date is required to schedule an announcement');
    }
    const publishDate = dto.publishDate || now;

    if (dto.isPinned) await assertPinCapacity();
    await assertAttachmentImages(dto.attachments);

    const announcement = {
      id: newId(),
      title: dto.title,
      category: dto.category,
      type: dto.type,
      description: sanitizeHtml(dto.description || '', SANITIZE_OPTIONS),
      attachments: dto.attachments || [],
      targetRoles: dto.targetRoles?.length ? dto.targetRoles : [ROLES.MANAGER, ROLES.USER],
      priority: dto.priority || 'NORMAL',
      isPinned: !!dto.isPinned,
      status,
      publishDate,
      expiryDate: dto.expiryDate || null,
      animationType: dto.animationType || 'NONE',
      viewCount: 0,
      createdBy: { id: actor.id, name: actor.name },
      createdAt: now,
      updatedAt: now,
    };

    const saved = await announcementRepo.create(announcement);
    await auditRepo.record({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'ANNOUNCEMENT_CREATED',
      target: saved.id,
      meta: { title: saved.title, status: saved.status },
    });
    return saved;
  },

  async update(actor, id, patch) {
    if (actor.role !== ROLES.ADMIN) throw new ForbiddenError('Only admins can edit announcements');
    const existing = await announcementRepo.getById(id);
    if (!existing) throw new NotFoundError('Announcement not found');

    // Only check when this edit is what turns the pin on — re-saving an
    // already-pinned announcement must not be blocked by its own slot.
    if (patch.isPinned === true && !existing.isPinned) await assertPinCapacity(id);
    // An edit can swap in new attachments, so re-check whatever it supplies.
    if (patch.attachments) await assertAttachmentImages(patch.attachments);

    const allowed = {};
    for (const k of [
      'title', 'category', 'type', 'attachments', 'targetRoles', 'priority',
      'isPinned', 'status', 'publishDate', 'expiryDate', 'animationType',
    ]) {
      if (patch[k] !== undefined) allowed[k] = patch[k];
    }
    if (patch.description !== undefined) {
      allowed.description = sanitizeHtml(patch.description, SANITIZE_OPTIONS);
    }
    allowed.updatedAt = new Date().toISOString();

    const updated = await announcementRepo.update(id, allowed);
    await auditRepo.record({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'ANNOUNCEMENT_UPDATED',
      target: id,
      meta: { patch: Object.keys(allowed) },
    });
    return updated;
  },

  async remove(actor, id) {
    if (actor.role !== ROLES.ADMIN) throw new ForbiddenError('Only admins can delete announcements');
    const existing = await announcementRepo.getById(id);
    if (!existing) throw new NotFoundError('Announcement not found');
    await announcementRepo.remove(id);
    await auditRepo.record({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'ANNOUNCEMENT_DELETED',
      target: id,
      meta: { title: existing.title },
    });
  },

  /** Admin management table — everything, raw status, no role/date filtering. */
  async listForAdmin(actor) {
    if (actor.role !== ROLES.ADMIN) throw new ForbiddenError();
    const items = await announcementRepo.listAll();
    return withListAttachmentUrls(orderAnnouncements(items, 'latest'));
  },

  /** Manager/User (and Admin, browsing as a viewer) feed. */
  async listForViewer(user, { category, priority, search, sort } = {}) {
    const items = await announcementRepo.listFeed();
    const q = (search || '').trim().toLowerCase();
    const filtered = items
      .filter((a) => (user.role === ROLES.ADMIN ? isEffectivelyVisible(a) : canViewerSee(a, user)))
      .filter((a) => !category || a.category === category)
      .filter((a) => !priority || a.priority === priority)
      .filter((a) => !q || a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) ||
        stripHtml(a.description).toLowerCase().includes(q));
    return withListAttachmentUrls(orderAnnouncements(filtered, sort));
  },

  async getById(user, id) {
    const a = await announcementRepo.getById(id);
    if (!a) throw new NotFoundError('Announcement not found');
    if (user.role !== ROLES.ADMIN && !canViewerSee(a, user)) throw new NotFoundError('Announcement not found');
    await announcementRepo.incrementViewCount(id);
    const [readCount, hasRead, withUrls] = await Promise.all([
      announcementRepo.getReadCount(id),
      announcementRepo.hasUserRead(id, user.id),
      // Detail view signs every attachment, not just the first — this is where
      // the gallery and the download list actually render them.
      withAttachmentUrls(a),
    ]);
    return { ...withUrls, viewCount: (a.viewCount || 0) + 1, readCount, hasRead };
  },

  async markRead(user, id) {
    const a = await announcementRepo.getById(id);
    if (!a) throw new NotFoundError('Announcement not found');
    if (user.role !== ROLES.ADMIN && !canViewerSee(a, user)) throw new NotFoundError('Announcement not found');
    await announcementRepo.markRead(id, user.id);
  },

  /** Related-announcements strip on the detail page: same category, most recent. */
  async listRelated(user, id, category, limit = 4) {
    const items = await announcementRepo.listFeed();
    const related = items
      .filter((a) => a.id !== id && a.category === category)
      .filter((a) => (user.role === ROLES.ADMIN ? isEffectivelyVisible(a) : canViewerSee(a, user)));
    return withListAttachmentUrls(orderAnnouncements(related, 'latest').slice(0, limit));
  },
};

function stripHtml(html = '') {
  return html.replace(/<[^>]*>/g, ' ');
}

export default announcementService;
