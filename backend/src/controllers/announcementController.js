import { announcementService } from '../services/announcementService.js';
import { asyncHandler, ok, list } from '../lib/http.js';
import { ROLES } from '../config/constants.js';

export const announcementController = {
  create: asyncHandler(async (req, res) => {
    const announcement = await announcementService.create(req.user, req.body);
    ok(res, { announcement }, 201);
  }),

  /** Admin gets the raw management list; Manager/User get the filtered/sorted feed. */
  list: asyncHandler(async (req, res) => {
    const items =
      req.user.role === ROLES.ADMIN && req.query.view === 'manage'
        ? await announcementService.listForAdmin(req.user)
        : await announcementService.listForViewer(req.user, req.query);
    list(res, items);
  }),

  getById: asyncHandler(async (req, res) => {
    const announcement = await announcementService.getById(req.user, req.params.id);
    ok(res, { announcement });
  }),

  update: asyncHandler(async (req, res) => {
    const announcement = await announcementService.update(req.user, req.params.id, req.body);
    ok(res, { announcement });
  }),

  remove: asyncHandler(async (req, res) => {
    await announcementService.remove(req.user, req.params.id);
    ok(res, { deleted: true });
  }),

  markRead: asyncHandler(async (req, res) => {
    await announcementService.markRead(req.user, req.params.id);
    ok(res, { read: true });
  }),

  related: asyncHandler(async (req, res) => {
    const items = await announcementService.listRelated(req.user, req.params.id, req.query.category);
    list(res, items);
  }),
};

export default announcementController;
