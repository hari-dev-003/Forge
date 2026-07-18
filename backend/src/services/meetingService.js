import { meetingRepo } from '../repositories/meetingRepo.js';
import { auditRepo } from '../repositories/auditRepo.js';
import { withPhotoUrl, withPhotoUrls } from './photoUrls.js';
import { newId } from '../lib/ids.js';
import { ROLES, MEETING_STATUS, MEETING_TYPES } from '../config/constants.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../lib/errors.js';

/** Can this principal see this meeting? */
export function canAccess(user, meeting) {
  if (!meeting) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.MANAGER) return meeting.managerId === user.id;
  return meeting.employeeId === user.id;
}

export const meetingService = {
  /** A field user logs a completed meeting (enters the PENDING review queue). */
  async create(user, dto) {
    if (user.role !== ROLES.USER) {
      throw new ForbiddenError('Only field users can submit meetings');
    }
    if (!user.managerId) {
      throw new BadRequestError('Your account is not assigned to a manager yet');
    }
    if (!dto.photo?.key) {
      throw new BadRequestError('A meeting photo is required');
    }

    const now = new Date().toISOString();
    const meeting = {
      meetingId: newId(),
      submissionId: newId(),
      type: dto.type,
      employeeId: user.id,
      employeeName: user.name,
      managerId: user.managerId,
      region: user.region || 'UNASSIGNED',
      photo: { key: dto.photo.key, caption: dto.photo.caption || '' },
      location: dto.location || null,
      isPremiumClient: !!dto.isPremiumClient,
      business: {
        purpose: dto.business?.purpose || '',
        interestLevel: dto.business?.interestLevel || null,
        followUpRequired: !!dto.business?.followUpRequired,
        priority: dto.business?.priority || null,
        outcome: dto.business?.outcome || '',
        remarks: dto.business?.remarks || '',
      },
      status: MEETING_STATUS.PENDING,
      review: null,
      points: { awarded: 0, ruleVersion: null, breakdown: [] },
      occurredAt: dto.occurredAt || now,
      createdAt: now,
    };

    if (dto.type === MEETING_TYPES.ONE_TO_ONE) {
      if (!dto.customer?.name) throw new BadRequestError('Customer name is required');
      meeting.customer = {
        name: dto.customer.name,
        phone: dto.customer.phone || '',
        address: dto.customer.address || '',
      };
    } else {
      if (!dto.group?.name) throw new BadRequestError('Group meeting name is required');
      meeting.group = {
        name: dto.group.name,
        attendees: Number(dto.group.attendees) || 0,
        attendeeList: Array.isArray(dto.group.attendeeList) ? dto.group.attendeeList : [],
      };
    }

    const saved = await meetingRepo.create(meeting);
    await auditRepo.record({
      actorId: user.id,
      actorRole: user.role,
      action: 'MEETING_SUBMITTED',
      target: saved.meetingId,
    });
    return withPhotoUrl(saved);
  },

  async getById(user, meetingId) {
    const meeting = await meetingRepo.getById(meetingId);
    if (!meeting) throw new NotFoundError('Meeting not found');
    if (!canAccess(user, meeting)) throw new ForbiddenError();
    return withPhotoUrl(meeting);
  },

  async listMine(user, { limit } = {}) {
    const items = await meetingRepo.listByUser(user.id, { limit });
    return withPhotoUrls(items);
  },

  /** Role-scoped listing for dashboards / history. */
  async list(user, { status, limit } = {}) {
    if (user.role === ROLES.USER) {
      const items = await meetingRepo.listByUser(user.id, { limit });
      return withPhotoUrls(items.filter((m) => !status || m.status === status));
    }
    const all = await meetingRepo.listAll();
    const scoped =
      user.role === ROLES.MANAGER ? all.filter((m) => m.managerId === user.id) : all;
    const filtered = scoped
      .filter((m) => !status || m.status === status)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return withPhotoUrls(filtered);
  },
};

export default meetingService;
