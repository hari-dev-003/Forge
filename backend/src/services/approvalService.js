import { getStore } from '../datastore/index.js';
import { meetingRepo } from '../repositories/meetingRepo.js';
import { pointsRepo } from '../repositories/pointsRepo.js';
import { leaderboardRepo } from '../repositories/leaderboardRepo.js';
import { configRepo } from '../repositories/configRepo.js';
import { auditRepo } from '../repositories/auditRepo.js';
import { computePoints } from './pointsEngine.js';
import { canAccess } from './meetingService.js';
import { storage } from '../storage/index.js';
import { ROLES, MEETING_STATUS } from '../config/constants.js';
import { BadRequestError, ForbiddenError, NotFoundError, ConflictError } from '../lib/errors.js';

const REVIEWABLE = [MEETING_STATUS.PENDING, MEETING_STATUS.MODIFICATION_REQUESTED];

function withPhotoUrl(meeting) {
  if (meeting?.photo?.key && !meeting.photo.url) {
    return { ...meeting, photo: { ...meeting.photo, url: storage.publicUrl(meeting.photo.key) } };
  }
  return meeting;
}

export const approvalService = {
  /** Manager review queue (default PENDING). */
  async queue(user, { status = MEETING_STATUS.PENDING, limit } = {}) {
    if (user.role === ROLES.ADMIN) {
      const all = await meetingRepo.listAll();
      return all
        .filter((m) => m.status === status)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .map(withPhotoUrl);
    }
    if (user.role !== ROLES.MANAGER) throw new ForbiddenError();
    const items = await meetingRepo.listByManagerStatus(user.id, status, { limit });
    return items.map(withPhotoUrl);
  },

  /**
   * Approve / reject / request-modification.
   * Approve awards points, appends the ledger line, and bumps the leaderboard
   * totals — all in ONE transaction guarded by the current status, so points
   * can never be double-awarded on retries or concurrent clicks.
   */
  async decide(user, meetingId, { decision, reason }) {
    const meeting = await meetingRepo.getById(meetingId);
    if (!meeting) throw new NotFoundError('Meeting not found');
    if (user.role !== ROLES.ADMIN && !(user.role === ROLES.MANAGER && canAccess(user, meeting))) {
      throw new ForbiddenError('You can only review meetings from your team');
    }
    if (!REVIEWABLE.includes(meeting.status)) {
      throw new ConflictError(`Meeting is already ${meeting.status}`);
    }

    const reviewedAt = new Date().toISOString();
    const review = { reviewerId: user.id, reviewerName: user.name, decision, reason: reason || '', reviewedAt };
    const store = getStore();

    if (decision === 'APPROVE') {
      const rules = await configRepo.getPointsRules();
      const { total, breakdown, ruleVersion } = computePoints(meeting, rules);

      const actions = [
        meetingRepo.statusTransition(meeting, MEETING_STATUS.APPROVED, {
          review,
          points: { awarded: total, ruleVersion, breakdown },
        }),
        pointsRepo.ledgerPutAction({
          userId: meeting.employeeId,
          userName: meeting.employeeName,
          meetingId: meeting.meetingId,
          points: total,
          breakdown,
          ruleVersion,
          reason: 'MEETING_APPROVED',
          createdAt: reviewedAt,
        }),
        ...leaderboardRepo.incrementActions({
          userId: meeting.employeeId,
          name: meeting.employeeName,
          points: total,
        }),
      ];
      await store.transactWrite(actions);
      await auditRepo.record({
        actorId: user.id,
        actorRole: user.role,
        action: 'MEETING_APPROVED',
        target: meeting.meetingId,
        meta: { points: total },
      });
    } else if (decision === 'REJECT' || decision === 'REQUEST_MODIFICATION') {
      if (!reason) throw new BadRequestError('A reason is required to reject or request changes');
      const nextStatus =
        decision === 'REJECT' ? MEETING_STATUS.REJECTED : MEETING_STATUS.MODIFICATION_REQUESTED;
      await store.transactWrite([
        meetingRepo.statusTransition(meeting, nextStatus, {
          review,
          points: { awarded: 0, ruleVersion: null, breakdown: [] },
        }),
      ]);
      await auditRepo.record({
        actorId: user.id,
        actorRole: user.role,
        action: decision,
        target: meeting.meetingId,
        meta: { reason },
      });
    } else {
      throw new BadRequestError('Unknown decision');
    }

    return withPhotoUrl(await meetingRepo.getById(meetingId));
  },
};

export default approvalService;
