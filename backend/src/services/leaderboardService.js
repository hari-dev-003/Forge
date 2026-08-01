import { leaderboardRepo, periodFor } from '../repositories/leaderboardRepo.js';
import { meetingRepo } from '../repositories/meetingRepo.js';
import { LEADERBOARD_SCOPES, MEETING_STATUS } from '../config/constants.js';
import { isoWeekKey, monthKey } from '../lib/ids.js';

export const leaderboardService = {
  async board(scope = LEADERBOARD_SCOPES.ALLTIME, { limit } = {}) {
    const rows = await leaderboardRepo.getBoard(scope);
    const boardRows = limit ? rows.slice(0, limit) : rows;
    const period = periodFor(scope);

    const enrichedRows = await Promise.all(
      boardRows.map(async (row) => {
        try {
          const meetings = await meetingRepo.listByUser(row.userId);
          
          // Filter meetings based on the leaderboard scope period (weekly/monthly/all-time)
          const filteredMeetings = meetings.filter((m) => {
            const mDate = new Date(m.createdAt);
            if (scope === LEADERBOARD_SCOPES.WEEKLY) {
              return isoWeekKey(mDate) === period;
            }
            if (scope === LEADERBOARD_SCOPES.MONTHLY) {
              return monthKey(mDate) === period;
            }
            return true;
          });

          const submissionsCount = filteredMeetings.length;
          const conductedCount = filteredMeetings.filter((m) => m.status === MEETING_STATUS.APPROVED).length;
          
          return {
            ...row,
            submissionsCount,
            conductedCount,
          };
        } catch (e) {
          return {
            ...row,
            submissionsCount: 0,
            conductedCount: 0,
          };
        }
      })
    );

    return enrichedRows;
  },

  /** A user's standing across all three scopes (rank + gap to next). */
  async me(userId) {
    const [alltime, weekly, monthly] = await Promise.all([
      leaderboardRepo.getUserRow(LEADERBOARD_SCOPES.ALLTIME, userId),
      leaderboardRepo.getUserRow(LEADERBOARD_SCOPES.WEEKLY, userId),
      leaderboardRepo.getUserRow(LEADERBOARD_SCOPES.MONTHLY, userId),
    ]);
    return { alltime, weekly, monthly };
  },
};

export default leaderboardService;
