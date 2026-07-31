import { getStore } from '../datastore/index.js';
import { K } from '../models/keys.js';
import { DEFAULT_POINTS_RULES } from '../config/constants.js';

const POINTS_RULES = 'POINTS_RULES';

const strip = (item) => {
  if (!item) return null;
  const { pk, sk, entity, ...rest } = item;
  return rest;
};

export const configRepo = {
  async getPointsRules() {
    const store = getStore();
    const item = await store.getItem(K.configPk(), K.configSk(POINTS_RULES));
    if (!item) return DEFAULT_POINTS_RULES;
    // Merge over the defaults so newly-added rule fields (e.g. approvalSlaHours,
    // or a new base.DIRECT_CONVERSION) apply even to orgs whose stored config
    // predates that field. A shallow merge isn't enough — nested objects like
    // `base`/`bonuses`/`penalties` must be merged too, or an old stored `base`
    // (missing a newly-added type) would wholesale replace the default and
    // silently drop it.
    const stored = strip(item).rules;
    return {
      ...DEFAULT_POINTS_RULES,
      ...stored,
      base: { ...DEFAULT_POINTS_RULES.base, ...stored.base },
      bonuses: { ...DEFAULT_POINTS_RULES.bonuses, ...stored.bonuses },
      penalties: { ...DEFAULT_POINTS_RULES.penalties, ...stored.penalties },
    };
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
