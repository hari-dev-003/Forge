import { authService } from '../services/authService.js';
import { asyncHandler, ok } from '../lib/http.js';

export const authController = {
  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    ok(res, result);
  }),

  me: asyncHandler(async (req, res) => {
    const user = await authService.me(req.user);
    ok(res, { user });
  }),
};

export default authController;
