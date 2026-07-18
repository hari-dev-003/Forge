// Pure points engine. Given a meeting + the admin-configured rules, it returns
// an itemised breakdown and total. Deterministic and side-effect free so it is
// easy to test and the result can be stamped onto the ledger for audit.
import { MEETING_TYPES } from '../config/constants.js';

const hoursBetween = (a, b) => Math.abs(new Date(a) - new Date(b)) / 36e5;

export function computePoints(meeting, rules) {
  const breakdown = [];

  // Base points by meeting type.
  const base = rules.base?.[meeting.type] ?? 0;
  breakdown.push({
    label: meeting.type === MEETING_TYPES.GROUP ? 'Group meeting' : 'One-to-one meeting',
    points: base,
  });

  // Premium client bonus.
  if (meeting.isPremiumClient && rules.bonuses?.premiumClient) {
    breakdown.push({ label: 'Premium client', points: rules.bonuses.premiumClient });
  }

  // Timeliness: late penalty takes precedence over the early-submission bonus.
  const occurred = meeting.occurredAt || meeting.createdAt;
  const submitted = meeting.createdAt;
  const lateAfter = rules.lateSubmissionAfterHours ?? 24;
  const isLate = hoursBetween(submitted, occurred) > lateAfter;

  if (isLate && rules.penalties?.lateSubmission) {
    breakdown.push({ label: 'Late submission', points: rules.penalties.lateSubmission });
  } else if (rules.bonuses?.earlySubmission) {
    const hour = new Date(submitted).getHours();
    if (hour < (rules.earlySubmissionBeforeHour ?? 12)) {
      breakdown.push({ label: 'Early submission', points: rules.bonuses.earlySubmission });
    }
  }

  const total = breakdown.reduce((sum, b) => sum + b.points, 0);
  return { total: Math.max(0, total), breakdown, ruleVersion: rules.version };
}

export default computePoints;
