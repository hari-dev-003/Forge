import { getStore } from '../datastore/index.js';
import { K } from '../models/keys.js';

const strip = (item) => {
  if (!item) return null;
  const { pk, sk, gsi1pk, gsi1sk, gsi2pk, gsi2sk, entity, ...rest } = item;
  return rest;
};

export const pointsRepo = {
  /** Append-only ledger entry. Built as a transaction action (idempotent via SK). */
  ledgerPutAction(entry) {
    return {
      type: 'put',
      item: {
        pk: K.pointsPk(entry.userId),
        sk: K.pointsSk(entry.createdAt, entry.meetingId),
        entity: 'POINTS',
        ...entry,
      },
      // Same meeting can only ever write one ledger line at this ts.
      condition: { notExists: true },
    };
  },

  async listByUser(userId) {
    const store = getStore();
    const items = await store.query({ pk: K.pointsPk(userId), skPrefix: 'POINTS#' });
    return items.map(strip);
  },
};

export default pointsRepo;
