import { getStore } from '../datastore/index.js';
import { K } from '../models/keys.js';
import { DEFAULT_POINTS_RULES } from '../config/constants.js';

const POINTS_RULES = 'POINTS_RULES';

const strip = (item) => {
  if (!item) return null;
  const { pk, sk, entity, ...rest } = item;
  return rest;
};

/**
 * Project a stored config onto the current rule shape.
 *
 * Two directions matter:
 *   - Fields added since the config was saved fall back to the default, so a
 *     newly-introduced meeting category still scores instead of reading as 0.
 *     A shallow merge isn't enough: an old stored `base` missing a category
 *     would otherwise replace the default wholesale and silently drop it.
 *   - Fields REMOVED since then (the early/late bonus + penalty, the threshold
 *     settings, the unused duplicate window) are dropped rather than passed
 *     through, so a v1 config can't hand the API dead keys that the engine no
 *     longer honours and the config screen no longer renders.
 *
 * Only the keys listed here survive — this is the whole rule surface.
 */
export function normalise(stored = {}) {
  return {
    version: stored.version || DEFAULT_POINTS_RULES.version,
    base: { ...DEFAULT_POINTS_RULES.base, ...stored.base },
    bonuses: { premiumClient: stored.bonuses?.premiumClient ?? DEFAULT_POINTS_RULES.bonuses.premiumClient },
    rejected: stored.rejected ?? DEFAULT_POINTS_RULES.rejected,
    approvalSlaHours: stored.approvalSlaHours ?? DEFAULT_POINTS_RULES.approvalSlaHours,
  };
}

export const configRepo = {
  async getPointsRules() {
    const store = getStore();
    const item = await store.getItem(K.configPk(), K.configSk(POINTS_RULES));
    if (!item) return DEFAULT_POINTS_RULES;
    return normalise(strip(item).rules);
  },

  async setPointsRules(rules) {
    const store = getStore();
    await store.putItem({
      pk: K.configPk(),
      sk: K.configSk(POINTS_RULES),
      entity: 'CONFIG',
      rules,
      updatedAt: new Date().toISOString(),
    });
    return rules;
  },
};

export default configRepo;
