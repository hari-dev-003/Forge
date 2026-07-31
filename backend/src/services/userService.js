import { userRepo } from '../repositories/userRepo.js';
import { authProvider } from '../auth/index.js';
import { auditRepo } from '../repositories/auditRepo.js';
import { generateTempPassword } from '../lib/passwords.js';
import { ROLES } from '../config/constants.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../lib/errors.js';

export const userService = {
  /**
   * Provisioning is entirely actor-driven — the client never chooses a role:
   *   Admin   -> creates a Manager, with a password the admin sets themselves
   *              (permanent, no forced change — matches existing behaviour).
   *   Manager -> creates a User on their own team, with a server-generated
   *              temporary password (returned once, here, for the manager to
   *              share) that Cognito forces the employee to change on first login.
   */
  async createUser(actor, dto) {
    if (actor.role === ROLES.ADMIN) {
      if (!dto.password) throw new BadRequestError('A temporary password is required');
      const { user } = await authProvider.adminCreateUser({
        email: dto.email,
        password: dto.password,
        name: dto.name,
        role: ROLES.MANAGER,
        managerId: null,
        city: dto.city,
        permanent: true,
      });
      await auditRepo.record({
        actorId: actor.id,
        actorRole: actor.role,
        action: 'USER_CREATED',
        target: user.id,
        meta: { email: user.email, role: user.role },
      });
      return { user };
    }

    if (actor.role === ROLES.MANAGER) {
      const tempPassword = generateTempPassword();
      const { user } = await authProvider.adminCreateUser({
        email: dto.email,
        password: tempPassword,
        name: dto.name,
        role: ROLES.USER,
        managerId: actor.id,
        city: dto.city,
        permanent: false,
      });
      await auditRepo.record({
        actorId: actor.id,
        actorRole: actor.role,
        action: 'USER_CREATED',
        target: user.id,
        meta: { email: user.email, role: user.role },
      });
      return { user, tempPassword };
    }

    throw new ForbiddenError();
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
    for (const k of ['name', 'city', 'active', 'managerId']) {
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
