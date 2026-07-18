import { meetingService } from '../services/meetingService.js';
import { asyncHandler, ok, list } from '../lib/http.js';

export const meetingController = {
  create: asyncHandler(async (req, res) => {
    const meeting = await meetingService.create(req.user, req.body);
    ok(res, { meeting }, 201);
  }),

  listMine: asyncHandler(async (req, res) => {
    const meetings = await meetingService.listMine(req.user, { limit: Number(req.query.limit) || undefined });
    list(res, meetings);
  }),

  list: asyncHandler(async (req, res) => {
    const meetings = await meetingService.list(req.user, { status: req.query.status });
    list(res, meetings);
  }),

  getById: asyncHandler(async (req, res) => {
    const meeting = await meetingService.getById(req.user, req.params.id);
    ok(res, { meeting });
  }),
};

export default meetingController;
