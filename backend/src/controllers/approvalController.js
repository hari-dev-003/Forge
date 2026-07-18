import { approvalService } from '../services/approvalService.js';
import { asyncHandler, ok, list } from '../lib/http.js';

export const approvalController = {
  queue: asyncHandler(async (req, res) => {
    const meetings = await approvalService.queue(req.user, { status: req.query.status });
    list(res, meetings);
  }),

  decide: asyncHandler(async (req, res) => {
    const meeting = await approvalService.decide(req.user, req.params.id, req.body);
    ok(res, { meeting });
  }),
};

export default approvalController;
