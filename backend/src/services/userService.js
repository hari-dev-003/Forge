import { userRepo } from '../repositories/userRepo.js';
import { authProvider } from '../auth/index.js';
import { auditRepo } from '../repositories/auditRepo.js';
import { ROLES } from '../config/constants.js';
import { NotFoundError } from '../lib/errors.js';

export const userService = {
  /** Admin creates a manager (with credentials for local auth) — always immediately active. */
  async createUser(actor, dto) {
    const { user } = await authProvider.adminCreateUser({
      email: dto.email,
      password: dto.password,
      name: dto.name,
      role: ROLES.MANAGER,
      managerId: null,
      region: dto.region,
    });
    await auditRepo.record({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'USER_CREATED',
      target: user.id,
      meta: { email: user.email, role: user.role },
    });
    return user;
  },

  /**
   * Public self-signup — kicks off Cognito's SignUp flow (emails a
   * verification code, this pool auto-verifies email). No DynamoDB profile
   * exists yet; confirmSignup() below finishes provisioning once verified.
   */
  async signup(dto) {
    await authProvider.selfSignUp({ email: dto.email, password: dto.password, name: dto.name });
  },

  /** Verify the emailed code and finish provisioning the field-user account. */
  async confirmSignup(dto) {
    const { user } = await authProvider.confirmSignUp({
      email: dto.email,
      code: dto.code,
      name: dto.name,
      userId: dto.userId,
    });
    await auditRepo.record({
      actorId: user.id,
      actorRole: ROLES.USER,
      action: 'USER_SIGNUP_CONFIRMED',
      target: user.id,
      meta: { email: user.email },
    });
    return user;
  },

  /** Re-send the signup verification code. */
  async resendSignupCode(dto) {
    await authProvider.resendSignUpCode({ email: dto.email });
  },

  async getProfile(id) {
    const user = await userRepo.getById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  },

  /** Role-scoped listing: admin sees all, manager sees their team. */
  async list(actor, { role } = {}) {
    if (actor.role === ROLES.ADMIN) {
      if (role) return userRepo.listByRole(role);
      return userRepo.listAll();
    }
    if (actor.role === ROLES.MANAGER) {
      return userRepo.listTeam(actor.id);
    }
    return [];
  },

  async listManagers() {
    return userRepo.listByRole(ROLES.MANAGER);
  },

  async updateUser(actor, id, patch) {
    const user = await userRepo.getById(id);
    if (!user) throw new NotFoundError('User not found');
    const allowed = {};
    for (const k of ['name', 'region', 'active', 'managerId']) {
      if (patch[k] !== undefined) allowed[k] = patch[k];
    }
    const updated = await userRepo.update(id, allowed);
    await auditRepo.record({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'USER_UPDATED',
      target: id,
      meta: { patch: allowed },
    });
    return updated;
  },
};

export default userService;
