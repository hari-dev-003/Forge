import { getStore } from '../datastore/index.js';
import { meetingRepo } from '../repositories/meetingRepo.js';
import { pointsRepo } from '../repositories/pointsRepo.js';
import { leaderboardRepo } from '../repositories/leaderboardRepo.js';
import { configRepo } from '../repositories/configRepo.js';
import { auditRepo } from '../repositories/auditRepo.js';
import { computePoints } from './pointsEngine.js';
import { canAccess } from './meetingService.js';
import { withPhotoUrl, withPhotoUrls } from './photoUrls.js';
import { ROLES, MEETING_STATUS } from '../config/constants.js';
import { BadRequestError, ForbiddenError, NotFoundError, ConflictError } from '../lib/errors.js';

const REVIEWABLE = [MEETING_STATUS.PENDING, MEETING_STATUS.MODIFICATION_REQUESTED];

/** Stamp each item with derived queue-age fields (oldest submissions surface first). */
function withAging(items, approvalSlaHours) {
  const now = Date.now();
  return items
    .map((m) => {
      const ageHours = (now - new Date(m.createdAt).getTime()) / 3_600_000;
      return { ...m, ageHours: Math.round(ageHours * 10) / 10, slaBreached: ageHours > approvalSlaHours };
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

export const approvalService = {
  /** Manager review queue (default PENDING), oldest-first with SLA-aging metadata. */
  async queue(user, { status = MEETING_STATUS.PENDING, limit } = {}) {
    const { approvalSlaHours } = await configRepo.getPointsRules();
    if (user.role === ROLES.ADMIN) {
      const all = await meetingRepo.listAll();
      const filtered = withAging(all.filter((m) => m.status === status), approvalSlaHours);
      return withPhotoUrls(filtered);
    }
    if (user.role !== ROLES.MANAGER) throw new ForbiddenError();
    const items = await meetingRepo.listByManagerStatus(user.id, status, { limit });
    return withPhotoUrls(withAging(items, approvalSlaHours));
  },

  /**
   * Approve / reject / request-modification.
   * Approve awards points, appends the ledger line, and bumps the leaderboard
   * totals — all in ONE transaction guarded by the current status, so points
   * can never be double-awarded on retries or concurrent clicks.
   */
  async decide(user, meetingId, { decision, reason, qualityScore }) {
    const meeting = await meetingRepo.getById(meetingId);
    if (!meeting) throw new NotFoundError('Meeting not found');
    if (user.role !== ROLES.ADMIN && !(user.role === ROLES.MANAGER && canAccess(user, meeting))) {
      throw new ForbiddenError('You can only review meetings from your team');
    }
    if (!REVIEWABLE.includes(meeting.status)) {
      throw new ConflictError(`Meeting is already ${meeting.status}`);
    }

    const reviewedAt = new Date().toISOString();
    const review = {
      reviewerId: user.id,
      reviewerName: user.name,
      decision,
      reason: reason || '',
      reviewedAt,
      ...(decision === 'APPROVE' && qualityScore ? { qualityScore } : {}),
    };
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

    return await withPhotoUrl(await meetingRepo.getById(meetingId));
  },
};

export default approvalService;
