import { getStore } from '../datastore/index.js';
import { K } from '../models/keys.js';

const strip = (item) => {
  if (!item) return null;
  const { pk, sk, gsi1pk, gsi1sk, gsi2pk, gsi2sk, entity, ...rest } = item;
  return rest;
};

function buildItem(m) {
  return {
    pk: K.meetingPk(m.meetingId),
    sk: K.meetingSk(),
    entity: 'MEETING',
    gsi1pk: K.meetingUserGsiPk(m.employeeId),
    gsi1sk: K.meetingUserGsiSk(m.createdAt, m.meetingId),
    gsi2pk: K.meetingMgrGsiPk(m.managerId, m.status),
    gsi2sk: K.meetingMgrGsiSk(m.createdAt, m.meetingId),
    ...m,
  };
}

export const meetingRepo = {
  async create(meeting) {
    const store = getStore();
    const item = buildItem(meeting);
    await store.putItem(item, { condition: { notExists: true } });
    return strip(item);
  },

  async getById(meetingId) {
    const store = getStore();
    return strip(await store.getItem(K.meetingPk(meetingId), K.meetingSk()));
  },

  /** Timeline for one employee, newest first. */
  async listByUser(employeeId, { limit } = {}) {
    const store = getStore();
    const items = await store.query({
      index: 'gsi1',
      indexPk: K.meetingUserGsiPk(employeeId),
      scanForward: false,
      limit,
    });
    return items.map(strip);
  },

  /** Manager review queue (or any status list for a manager), newest first. */
  async listByManagerStatus(managerId, status, { limit } = {}) {
    const store = getStore();
    const items = await store.query({
      index: 'gsi2',
      indexPk: K.meetingMgrGsiPk(managerId, status),
      scanForward: false,
      limit,
    });
    return items.map(strip);
  },

  async listAll() {
    const store = getStore();
    const items = await store.scan({ typeEquals: 'MEETING' });
    return items.map(strip);
  },

  /**
   * Build a datastore transaction action that flips a meeting's status,
   * keeping GSI2 (manager queue) in sync, guarded by the current status
   * so points can never be awarded twice.
   */
  statusTransition(meeting, newStatus, extraSet = {}) {
    return {
      type: 'update',
      pk: K.meetingPk(meeting.meetingId),
      sk: K.meetingSk(),
      set: {
        status: newStatus,
        gsi2pk: K.meetingMgrGsiPk(meeting.managerId, newStatus),
        ...extraSet,
      },
      condition: { field: 'status', equals: meeting.status },
    };
  },
};

export default meetingRepo;
