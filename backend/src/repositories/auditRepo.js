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
};

export default auditRepo;
