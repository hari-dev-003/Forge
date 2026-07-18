import { meetingRepo } from '../repositories/meetingRepo.js';
import { userRepo } from '../repositories/userRepo.js';
import { leaderboardRepo } from '../repositories/leaderboardRepo.js';
import { ROLES, MEETING_STATUS, MEETING_TYPES, LEADERBOARD_SCOPES } from '../config/constants.js';
import { dayKey } from '../lib/ids.js';

// NOTE: MVP dashboards compute over the meeting set directly. PROJECT_PLAN.md §8
// replaces this with a DynamoDB Streams aggregation pipeline for scale.

const isToday = (iso) => iso?.slice(0, 10) === dayKey();

function tally(meetings) {
  const today = meetings.filter((m) => isToday(m.createdAt)).length;
  const byStatus = { PENDING: 0, APPROVED: 0, REJECTED: 0, MODIFICATION_REQUESTED: 0 };
  const byType = { ONE_TO_ONE: 0, GROUP: 0 };
  for (const m of meetings) {
    byStatus[m.status] = (byStatus[m.status] || 0) + 1;
    byType[m.type] = (byType[m.type] || 0) + 1;
  }
  const reviewed = byStatus.APPROVED + byStatus.REJECTED;
  const approvalRate = reviewed ? Math.round((byStatus.APPROVED / reviewed) * 100) : 0;
  return { total: meetings.length, today, byStatus, byType, approvalRate };
}

/** Last 7 days of meeting counts, oldest -> newest. */
function trend(meetings) {
  const days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  return days.map((day) => ({
    day,
    count: meetings.filter((m) => m.createdAt?.slice(0, 10) === day).length,
  }));
}

export const dashboardService = {
  async summary(user) {
    if (user.role === ROLES.USER) {
      const meetings = await meetingRepo.listByUser(user.id);
      const me = await leaderboardRepo.getUserRow(LEADERBOARD_SCOPES.ALLTIME, user.id);
      return {
        role: user.role,
        kpis: tally(meetings),
        points: me.points || 0,
        rank: me.rank,
        gapToNext: me.gapToNext,
        trend: trend(meetings),
      };
    }

    const all = await meetingRepo.listAll();
    const meetings =
      user.role === ROLES.MANAGER ? all.filter((m) => m.managerId === user.id) : all;
    const kpis = tally(meetings);

    const team =
      user.role === ROLES.MANAGER
        ? await userRepo.listTeam(user.id)
        : await userRepo.listByRole(ROLES.USER);
    const managers = user.role === ROLES.ADMIN ? await userRepo.listByRole(ROLES.MANAGER) : [];

    const board = await leaderboardRepo.getBoard(LEADERBOARD_SCOPES.ALLTIME);
    const topPerformer = board[0] || null;

    return {
      role: user.role,
      kpis,
      trend: trend(meetings),
      counts: {
        teamSize: team.length,
        managers: managers.length,
        pendingReviews: kpis.byStatus.PENDING,
      },
      topPerformer,
      leaderboardPreview: board.slice(0, 5),
    };
  },
};

export default dashboardService;
