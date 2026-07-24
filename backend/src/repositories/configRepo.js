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
    // Merge over the defaults so newly-added rule fields (e.g. approvalSlaHours)
    // apply even to orgs whose stored config predates that field.
    return item ? { ...DEFAULT_POINTS_RULES, ...strip(item).rules } : DEFAULT_POINTS_RULES;
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
