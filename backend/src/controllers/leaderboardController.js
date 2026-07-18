import { leaderboardService } from '../services/leaderboardService.js';
import { asyncHandler, ok, list } from '../lib/http.js';

export const leaderboardController = {
  board: asyncHandler(async (req, res) => {
    const rows = await leaderboardService.board(req.query.scope, { limit: req.query.limit });
    list(res, rows, { scope: req.query.scope });
  }),

  me: asyncHandler(async (req, res) => {
    const standing = await leaderboardService.me(req.user.id);
    ok(res, standing);
  }),
};

export default leaderboardController;
