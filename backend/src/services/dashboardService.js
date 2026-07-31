import { meetingRepo } from '../repositories/meetingRepo.js';
import { userRepo } from '../repositories/userRepo.js';
import { leaderboardRepo } from '../repositories/leaderboardRepo.js';
import { configRepo } from '../repositories/configRepo.js';
import { ROLES, MEETING_STATUS, LEADERBOARD_SCOPES } from '../config/constants.js';
import { dayKey } from '../lib/ids.js';

// NOTE: MVP dashboards compute over the meeting set directly. PROJECT_PLAN.md §8
// replaces this with a DynamoDB Streams aggregation pipeline for scale.

const isToday = (iso) => iso?.slice(0, 10) === dayKey();

function tally(meetings) {
  const today = meetings.filter((m) => isToday(m.createdAt)).length;
  const byStatus = { PENDING: 0, APPROVED: 0, REJECTED: 0, MODIFICATION_REQUESTED: 0 };
  const byType = { ONE_TO_ONE: 0, GROUP: 0, DIRECT_CONVERSION: 0 };
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

/** This-week vs. prior-week submission counts, for a trend delta badge. */
function weekOverWeek(meetings) {
  const now = Date.now();
  const daysAgo = (iso) => (now - new Date(iso).getTime()) / 86_400_000;
  const thisWeek = meetings.filter((m) => daysAgo(m.createdAt) <= 7).length;
  const prevWeek = meetings.filter((m) => { const d = daysAgo(m.createdAt); return d > 7 && d <= 14; }).length;
  const deltaPct = prevWeek ? Math.round(((thisWeek - prevWeek) / prevWeek) * 100) : (thisWeek ? 100 : 0);
  return { thisWeek, prevWeek, deltaPct };
}

/** Total points awarded across approved meetings in scope. */
function pointsAwarded(meetings) {
  return meetings.reduce((sum, m) => sum + (m.status === MEETING_STATUS.APPROVED ? m.points?.awarded || 0 : 0), 0);
}

/**
 * PENDING items bucketed by how close they are to breaching the approval
 * SLA, plus the oldest 5 (by wait time) for an actionable "needs attention"
 * list — replaces the old single pendingAging count with real signal.
 */
function slaBreakdown(meetings, approvalSlaHours) {
  const now = Date.now();
  let onTrack = 0, dueSoon = 0, breached = 0;
  const withAge = meetings
    .filter((m) => m.status === MEETING_STATUS.PENDING)
    .map((m) => {
      const hoursWaiting = (now - new Date(m.createdAt).getTime()) / 3_600_000;
      if (hoursWaiting > approvalSlaHours) breached += 1;
      else if (hoursWaiting > approvalSlaHours * 0.5) dueSoon += 1;
      else onTrack += 1;
      return { meetingId: m.meetingId, employeeName: m.employeeName, type: m.type, hoursWaiting: Math.round(hoursWaiting) };
    });
  const oldest = [...withAge].sort((a, b) => b.hoursWaiting - a.hoursWaiting).slice(0, 5);
  return { onTrack, dueSoon, breached, oldest };
}

/**
 * Role-scoped performance rows: pass `team`/`managers` as the roster (so
 * zero-submission people still show up) and a key function that pulls the
 * grouping id off a meeting (employeeId for a manager's team, managerId for
 * an admin's manager rollup) — same shape either way.
 */
function performanceBreakdown(meetings, roster, keyOf) {
  const byKey = new Map(roster.map((p) => [p.id, { id: p.id, name: p.name, submissions: 0, approved: 0, points: 0 }]));
  for (const m of meetings) {
    const row = byKey.get(keyOf(m));
    if (!row) continue;
    row.submissions += 1;
    if (m.status === MEETING_STATUS.APPROVED) {
      row.approved += 1;
      row.points += m.points?.awarded || 0;
    }
  }
  return [...byKey.values()]
    .map((r) => ({ ...r, approvalRate: r.submissions ? Math.round((r.approved / r.submissions) * 100) : 0 }))
    .sort((a, b) => b.points - a.points);
}

/** Latest N meetings in scope, any status, for an activity feed. */
function recentActivity(meetings, n = 6) {
  return [...meetings]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, n)
    .map((m) => ({ meetingId: m.meetingId, employeeName: m.employeeName, type: m.type, status: m.status, createdAt: m.createdAt }));
}

/** Count + points per city — only meaningful when an org spans more than one. */
function cityBreakdown(meetings) {
  const byCity = new Map();
  for (const m of meetings) {
    const city = m.city || 'UNASSIGNED';
    if (!byCity.has(city)) byCity.set(city, { city, count: 0, points: 0 });
    const row = byCity.get(city);
    row.count += 1;
    if (m.status === MEETING_STATUS.APPROVED) row.points += m.points?.awarded || 0;
  }
  return [...byCity.values()].sort((a, b) => b.count - a.count);
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

    const { approvalSlaHours } = await configRepo.getPointsRules();

    const performance =
      user.role === ROLES.MANAGER
        ? performanceBreakdown(meetings, team, (m) => m.employeeId)
        : performanceBreakdown(meetings, managers, (m) => m.managerId);

    const result = {
      role: user.role,
      kpis,
      trend: trend(meetings),
      weekOverWeek: weekOverWeek(meetings),
      pointsAwarded: pointsAwarded(meetings),
      sla: slaBreakdown(meetings, approvalSlaHours),
      performance: performance.slice(0, 8),
      recentActivity: recentActivity(meetings),
      counts: {
        teamSize: team.length,
        managers: managers.length,
        pendingReviews: kpis.byStatus.PENDING,
      },
      topPerformer,
      leaderboardPreview: board.slice(0, 5),
    };

    if (user.role === ROLES.ADMIN) {
      result.counts.pendingApprovals = [...team, ...managers].filter((u) => u.active === false).length;
      const cities = cityBreakdown(meetings);
      if (cities.length > 1) result.cities = cities;
    }

    return result;
  },
};

export default dashboardService;
