import { dashboardService } from '../services/dashboardService.js';
import { asyncHandler, ok } from '../lib/http.js';

export const dashboardController = {
  summary: asyncHandler(async (req, res) => {
    const summary = await dashboardService.summary(req.user);
    ok(res, summary);
  }),
};

export default dashboardController;
