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

  signup: asyncHandler(async (req, res) => {
    const user = await authService.signup(req.body);
    ok(res, { user, message: 'Signup successful. Your account is pending admin approval.' }, 201);
  }),
};

export default authController;
