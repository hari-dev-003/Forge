// Pure points engine. Given a meeting + the admin-configured rules, it returns
// an itemised breakdown and total. Deterministic and side-effect free so it is
// easy to test and the result can be stamped onto the ledger for audit.
//
// Every number here comes from `rules` — the admin's saved configuration is
// what decides a meeting's worth; nothing is hardcoded but the labels.
//
// The formula is: base points for the meeting's category, plus the premium
// client bonus when the meeting is flagged as one. Timeliness scoring (the
// early-submission bonus and late-submission penalty) was removed.
import { MEETING_TYPES } from '../config/constants.js';

const TYPE_LABEL = {
  [MEETING_TYPES.ONE_TO_ONE]: 'One-to-one meeting',
  [MEETING_TYPES.GROUP]: 'Group meeting',
  [MEETING_TYPES.DIRECT_CONVERSION]: 'Direct conversion',
};

export function computePoints(meeting, rules) {
  const breakdown = [];

  // Base points for this meeting's category, straight from the configured rules.
  const base = rules.base?.[meeting.type] ?? 0;
  breakdown.push({ label: TYPE_LABEL[meeting.type] || 'Meeting', points: base });

  // The only bonus.
  if (meeting.isPremiumClient && rules.bonuses?.premiumClient) {
    breakdown.push({ label: 'Premium client', points: rules.bonuses.premiumClient });
  }

  const total = breakdown.reduce((sum, b) => sum + b.points, 0);
  return { total: Math.max(0, total), breakdown, ruleVersion: rules.version };
}

export default computePoints;
