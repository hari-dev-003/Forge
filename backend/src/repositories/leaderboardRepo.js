import { getStore } from '../datastore/index.js';
import { K } from '../models/keys.js';
import { LEADERBOARD_SCOPES } from '../config/constants.js';
import { isoWeekKey, monthKey } from '../lib/ids.js';

const strip = (item) => {
  if (!item) return null;
  const { pk, sk, gsi1pk, gsi1sk, gsi2pk, gsi2sk, entity, ...rest } = item;
  return rest;
};

/** Resolve the period string for a scope at a given date. */
export function periodFor(scope, date = new Date()) {
  if (scope === LEADERBOARD_SCOPES.WEEKLY) return isoWeekKey(date);
  if (scope === LEADERBOARD_SCOPES.MONTHLY) return monthKey(date);
  return 'ALL';
}

export const leaderboardRepo = {
  /**
   * Transaction actions that add `points` to a user's totals across all three
   * scopes. SET refreshes denormalised name; ADD keeps the running total.
   */
  incrementActions({ userId, name, points, date = new Date() }) {
    return Object.values(LEADERBOARD_SCOPES).map((scope) => {
      const period = periodFor(scope, date);
      return {
        type: 'update',
        pk: K.lbPk(scope, period),
        sk: K.lbSk(userId),
        set: { userId, name, scope, period, updatedAt: new Date().toISOString() },
        add: { points },
      };
    });
  },

  /** Full ranked board for a scope/period (sorted desc in app — fine at MVP scale). */
  async getBoard(scope, date = new Date()) {
    const store = getStore();
    const period = periodFor(scope, date);
    const items = await store.query({ pk: K.lbPk(scope, period) });
    return items
      .map(strip)
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .map((row, i) => ({ ...row, rank: i + 1 }));
  },

  async getUserRow(scope, userId, date = new Date()) {
    const board = await this.getBoard(scope, date);
    const idx = board.findIndex((r) => r.userId === userId);
    if (idx === -1) return { userId, points: 0, rank: null, gapToNext: null, total: board.length };
    const row = board[idx];
    const next = board[idx - 1];
    return {
      ...row,
      total: board.length,
      gapToNext: next ? next.points - row.points : 0,
    };
  },
};

export default leaderboardRepo;
