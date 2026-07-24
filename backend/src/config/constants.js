// Domain enums & shared constants. Keep these in sync with the frontend.

export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER',
});

export const MEETING_TYPES = Object.freeze({
  ONE_TO_ONE: 'ONE_TO_ONE',
  GROUP: 'GROUP',
});

export const MEETING_STATUS = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  MODIFICATION_REQUESTED: 'MODIFICATION_REQUESTED',
});

export const INTEREST_LEVELS = Object.freeze({
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
});

export const LEADERBOARD_SCOPES = Object.freeze({
  ALLTIME: 'ALLTIME',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
});

// Default, admin-editable points rules (see config/POINTS_RULES item).
export const DEFAULT_POINTS_RULES = Object.freeze({
  version: 'v1',
  base: { ONE_TO_ONE: 10, GROUP: 25 },
  bonuses: { premiumClient: 20, earlySubmission: 5 },
  penalties: { lateSubmission: -5 },
  rejected: 0,
  // A meeting is "early" if submitted before this hour (local) on the meeting day.
  earlySubmissionBeforeHour: 12,
  // A meeting is "late" if submitted more than this many hours after it occurred.
  lateSubmissionAfterHours: 24,
  // Same customer phone within this window scores 0 (optional business rule).
  duplicateWindowDays: 7,
  // A pending review is "aged"/SLA-breached once it's waited longer than this.
  approvalSlaHours: 24,
});
