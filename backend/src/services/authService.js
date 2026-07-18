import { authProvider } from '../auth/index.js';
import { userRepo } from '../repositories/userRepo.js';

export const authService = {
  /** Exchange email/password for a Cognito ID token (backend-proxied login). */
  async login(dto) {
    return authProvider.login(dto);
  },

  /** Fresh profile for the authenticated principal (picks up manager/region changes). */
  async me(principal) {
    const latest = await userRepo.getById(principal.id);
    return latest || principal;
  },
};

export default authService;
