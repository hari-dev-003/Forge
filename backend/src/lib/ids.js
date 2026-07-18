import { v4 as uuidv4 } from 'uuid';

export const newId = () => uuidv4();

/** ISO week key, e.g. 2026-W29 — used for weekly leaderboard scope. */
export function isoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Month key, e.g. 2026-07 — used for monthly leaderboard/rollups. */
export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Day key, e.g. 2026-07-18. */
export function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
