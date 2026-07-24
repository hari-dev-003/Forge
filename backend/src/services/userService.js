import { userRepo } from '../repositories/userRepo.js';
import { authProvider } from '../auth/index.js';
import { auditRepo } from '../repositories/auditRepo.js';
import { ROLES } from '../config/constants.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';

export const userService = {
  /** Admin creates a manager or user (with credentials for local auth). */
  async createUser(actor, dto) {
    if (dto.role === ROLES.USER && !dto.managerId) {
      throw new BadRequestError('A field user must be assigned to a manager');
    }
    if (dto.managerId) {
      const mgr = await userRepo.getById(dto.managerId);
      if (!mgr || mgr.role !== ROLES.MANAGER) {
        throw new BadRequestError('managerId must reference an existing manager');
      }
    }
    // Provision in Cognito (credentials + group) and persist the DynamoDB profile.
    const { user } = await authProvider.adminCreateUser(dto);
    await auditRepo.record({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'USER_CREATED',
      target: user.id,
      meta: { email: user.email, role: user.role },
    });
    return user;
  },

  /** Public self-signup — always a field user (Employee), inactive until an admin approves them. */
  async signup(dto) {
    const { user } = await authProvider.adminCreateUser({
      email: dto.email,
      password: dto.password,
      name: dto.name,
      userId: dto.userId,
      role: ROLES.USER,
      managerId: null,
      active: false,
    });
    await auditRepo.record({
      actorId: user.id,
      actorRole: ROLES.USER,
      action: 'USER_SIGNUP',
      target: user.id,
      meta: { email: user.email },
    });
    return user;
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
