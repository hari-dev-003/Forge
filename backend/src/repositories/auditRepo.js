import { getStore } from '../datastore/index.js';
import { K } from '../models/keys.js';
import { newId, dayKey } from '../lib/ids.js';

export const auditRepo = {
  /** Fire-and-forget append of an accountability record. */
  async record({ actorId, actorRole, action, target, meta }) {
    const store = getStore();
    const ts = new Date().toISOString();
    await store.putItem({
      pk: K.auditPk(dayKey()),
      sk: K.auditSk(ts, newId()),
      entity: 'AUDIT',
      actorId,
      actorRole,
      action,
      target,
      meta,
      ts,
    });
  },

  /** Admin-only read path: newest first, optionally filtered by actor/action. */
  async list({ limit = 100, actorId, action } = {}) {
    const store = getStore();
    const items = await store.scan({ typeEquals: 'AUDIT' });
    const filtered = items
      .filter((i) => (actorId ? i.actorId === actorId : true))
      .filter((i) => (action ? i.action === action : true))
      .sort((a, b) => (a.ts < b.ts ? 1 : -1));
    return filtered.slice(0, limit).map(({ pk, sk, entity, ...rest }) => rest);
  },
};

export default auditRepo;
