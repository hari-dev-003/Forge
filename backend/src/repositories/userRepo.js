import { getStore } from '../datastore/index.js';
import { K } from '../models/keys.js';
import { ROLES } from '../config/constants.js';

const toUser = (item) => {
  if (!item) return null;
  const { pk, sk, gsi1pk, gsi1sk, gsi2pk, gsi2sk, entity, passwordHash, ...rest } = item;
  return rest;
};

function buildItem(user) {
  const item = {
    pk: K.userPk(user.id),
    sk: K.userSk(),
    entity: 'USER',
    gsi1pk: K.roleGsiPk(user.role),
    gsi1sk: K.userRoleGsiSk(user.name, user.id),
    ...user,
  };
  if (user.role === ROLES.USER && user.managerId) {
    item.gsi2pk = K.teamGsiPk(user.managerId);
    item.gsi2sk = K.teamGsiSk(user.id);
  }
  return item;
}

export const userRepo = {
  async create(user) {
    const store = getStore();
    const item = buildItem(user);
    await store.putItem(item, { condition: { notExists: true } });
    return toUser(item);
  },

  async getById(id) {
    const store = getStore();
    return toUser(await store.getItem(K.userPk(id), K.userSk()));
  },

  async update(id, patch) {
    const store = getStore();
    const updated = await store.updateItem(K.userPk(id), K.userSk(), { set: patch });
    return toUser(updated);
  },

  async listByRole(role) {
    const store = getStore();
    const items = await store.query({ index: 'gsi1', indexPk: K.roleGsiPk(role) });
    return items.map(toUser);
  },

  async listTeam(managerId) {
    const store = getStore();
    const items = await store.query({ index: 'gsi2', indexPk: K.teamGsiPk(managerId) });
    return items.map(toUser);
  },

  async listAll() {
    const store = getStore();
    const items = await store.scan({ typeEquals: 'USER' });
    return items.map(toUser);
  },
};

export default userRepo;
