// Announcements (and their per-user read receipts) live in their own DynamoDB
// table — see datastore/index.js for why. Same pk/sk + GSI1 shape as the main
// table, so the key builders in models/keys.js are unchanged.
import { getAnnouncementStore } from '../datastore/index.js';
import { K } from '../models/keys.js';
import { ConflictError } from '../lib/errors.js';

const strip = (item) => {
  if (!item) return null;
  const { pk, sk, gsi1pk, gsi1sk, entity, ...rest } = item;
  return rest;
};

function buildItem(a) {
  return {
    pk: K.announcementPk(a.id),
    sk: K.announcementSk(),
    entity: 'ANNOUNCEMENT',
    gsi1pk: K.announcementFeedGsiPk(),
    gsi1sk: K.announcementFeedGsiSk(a.publishDate, a.id),
    ...a,
  };
}

export const announcementRepo = {
  async create(announcement) {
    const store = getAnnouncementStore();
    const item = buildItem(announcement);
    await store.putItem(item, { condition: { notExists: true } });
    return strip(item);
  },

  async getById(id) {
    const store = getAnnouncementStore();
    return strip(await store.getItem(K.announcementPk(id), K.announcementSk()));
  },

  /** Admin management view — every announcement regardless of status/dates. */
  async listAll() {
    const store = getAnnouncementStore();
    const items = await store.scan({ typeEquals: 'ANNOUNCEMENT' });
    return items.map(strip);
  },

  /** Public feed, newest-first (pinning/role/date filtering happens in the service). */
  async listFeed() {
    const store = getAnnouncementStore();
    const items = await store.query({
      index: 'gsi1',
      indexPk: K.announcementFeedGsiPk(),
      scanForward: false,
    });
    return items.map(strip);
  },

  /**
   * Re-derives the feed GSI sort key whenever publishDate changes, so an edit
   * that reschedules an announcement keeps the feed query correctly ordered.
   */
  async update(id, patch) {
    const store = getAnnouncementStore();
    const set = { ...patch };
    if (patch.publishDate) set.gsi1sk = K.announcementFeedGsiSk(patch.publishDate, id);
    const updated = await store.updateItem(K.announcementPk(id), K.announcementSk(), { set });
    return strip(updated);
  },

  async remove(id) {
    const store = getAnnouncementStore();
    await store.deleteItem(K.announcementPk(id), K.announcementSk());
    // Best-effort cleanup of read receipts — not transactional, but an orphaned
    // read record for a deleted announcement is harmless (never queried standalone).
    const reads = await store.query({ pk: K.announcementPk(id), skPrefix: 'READ#' });
    await Promise.all(reads.map((r) => store.deleteItem(r.pk, r.sk)));
  },

  async incrementViewCount(id) {
    const store = getAnnouncementStore();
    await store.updateItem(K.announcementPk(id), K.announcementSk(), { add: { viewCount: 1 } });
  },

  /** Idempotent — re-marking the same user/announcement is a silent no-op. */
  async markRead(id, userId) {
    const store = getAnnouncementStore();
    try {
      await store.putItem(
        {
          pk: K.announcementPk(id),
          sk: K.announcementReadSk(userId),
          entity: 'ANNOUNCEMENT_READ',
          announcementId: id,
          userId,
          readAt: new Date().toISOString(),
        },
        { condition: { notExists: true } }
      );
    } catch (e) {
      if (!(e instanceof ConflictError)) throw e;
    }
  },

  async hasUserRead(id, userId) {
    const store = getAnnouncementStore();
    const item = await store.getItem(K.announcementPk(id), K.announcementReadSk(userId));
    return !!item;
  },

  async getReadCount(id) {
    const store = getAnnouncementStore();
    const items = await store.query({ pk: K.announcementPk(id), skPrefix: 'READ#' });
    return items.length;
  },
};

export default announcementRepo;
