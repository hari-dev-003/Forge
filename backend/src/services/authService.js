import { authProvider } from '../auth/index.js';
import { userRepo } from '../repositories/userRepo.js';
import { userService } from './userService.js';

export const authService = {
  /** Exchange email/password for a Cognito ID token (backend-proxied login). */
  async login(dto) {
    return authProvider.login(dto);
  },

  /** Public self-signup — kicks off Cognito's email verification (see userService.signup). */
  async signup(dto) {
    return userService.signup(dto);
  },

  /** Verify the emailed code and finish provisioning the field-user account. */
  async confirmSignup(dto) {
    return userService.confirmSignup(dto);
  },

  /** Re-send the signup verification code. */
  async resendSignupCode(dto) {
    return userService.resendSignupCode(dto);
  },

  /** Fresh profile for the authenticated principal (picks up manager/region changes). */
  async me(principal) {
    const latest = await userRepo.getById(principal.id);
    return latest || principal;
  },
};

export default authService;
