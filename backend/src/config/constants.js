// Domain enums & shared constants. Keep these in sync with the frontend.

export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER',
});

export const MEETING_TYPES = Object.freeze({
  ONE_TO_ONE: 'ONE_TO_ONE',
  GROUP: 'GROUP',
  DIRECT_CONVERSION: 'DIRECT_CONVERSION',
});

// Direct Conversion's "stacking type" is derived from staking volume, never
// client-supplied: under this threshold is BVS, at/above it is ESP.
export const STAKING_VOLUME_THRESHOLD = 100000;
export const STAKING_TYPES = Object.freeze({ BVS: 'BVS', ESP: 'ESP' });

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

export const ANNOUNCEMENT_TYPES = Object.freeze({
  IMAGE: 'IMAGE',
  TEXT: 'TEXT',
  DOCUMENT: 'DOCUMENT',
});

export const ANNOUNCEMENT_CATEGORIES = Object.freeze({
  GENERAL: 'GENERAL',
  EVENT: 'EVENT',
  CIRCULAR: 'CIRCULAR',
  TRAINING: 'TRAINING',
  WORKSHOP: 'WORKSHOP',
  MEETING: 'MEETING',
  EMERGENCY: 'EMERGENCY',
  NEWS: 'NEWS',
});

export const ANNOUNCEMENT_PRIORITY = Object.freeze({
  NORMAL: 'NORMAL',
  IMPORTANT: 'IMPORTANT',
  URGENT: 'URGENT',
});

// DRAFT is never shown to Manager/User. SCHEDULED/PUBLISHED visibility is
// further gated at read time by publishDate/expiryDate (see announcementService
// — lazy evaluation, no cron/background job exists in this codebase).
export const ANNOUNCEMENT_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
});

// Only POPUP is actually implemented in Phase 1 (Slide Panel / Login Splash
// are documented roadmap, not built) — NONE is the default/no-animation case.
export const ANNOUNCEMENT_ANIMATION = Object.freeze({
  NONE: 'NONE',
  POPUP: 'POPUP',
});

// Default, admin-editable points rules (see config/POINTS_RULES item).
export const DEFAULT_POINTS_RULES = Object.freeze({
  version: 'v1',
  base: { ONE_TO_ONE: 10, GROUP: 25, DIRECT_CONVERSION: 15 },
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
