import { leaderboardRepo } from '../repositories/leaderboardRepo.js';
import { LEADERBOARD_SCOPES } from '../config/constants.js';

export const leaderboardService = {
  async board(scope = LEADERBOARD_SCOPES.ALLTIME, { limit } = {}) {
    const rows = await leaderboardRepo.getBoard(scope);
    return limit ? rows.slice(0, limit) : rows;
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
