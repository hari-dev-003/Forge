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
    await authService.signup(req.body);
    ok(res, { message: 'We\'ve emailed you a verification code — enter it to activate your account.' }, 201);
  }),

  confirmSignup: asyncHandler(async (req, res) => {
    const user = await authService.confirmSignup(req.body);
    ok(res, { user, message: 'Account verified — you can now sign in.' });
  }),

  resendSignupCode: asyncHandler(async (req, res) => {
    await authService.resendSignupCode(req.body);
    ok(res, { message: 'A new code is on its way.' });
  }),
};

export default authController;
