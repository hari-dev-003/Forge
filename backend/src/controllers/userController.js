import { userService } from '../services/userService.js';
import { asyncHandler, ok, list } from '../lib/http.js';

export const userController = {
  create: asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.user, req.body);
    ok(res, { user }, 201);
  }),

  list: asyncHandler(async (req, res) => {
    const users = await userService.list(req.user, { role: req.query.role });
    list(res, users);
  }),

  managers: asyncHandler(async (_req, res) => {
    const managers = await userService.listManagers();
    list(res, managers);
  }),

  update: asyncHandler(async (req, res) => {
    const user = await userService.updateUser(req.user, req.params.id, req.body);
    ok(res, { user });
  }),
};

export default userController;
