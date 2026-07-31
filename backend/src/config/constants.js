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

// The size ceiling for EVERY image uploaded anywhere in the product — meeting
// proof photos, the Direct Conversion screenshot, and image attachments on an
// announcement. A file of exactly this size is allowed; anything larger is not.
//
// Enforced twice: client-side for the UX, and again server-side against the
// object actually in the bucket (see services/uploadGuards.js), because a
// presigned PUT carries no size condition and the client could otherwise
// upload anything and simply report a smaller number.
export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Proof photos per meeting — applies to every meeting type; at least one is required.
export const MEETING_PHOTO_MAX = 3;

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

// Pinned announcements are rendered full-width above the feed grid, so the
// list stops being a "highlights" section if everything is pinned. Enforced
// server-side in announcementService (create + update).
export const MAX_PINNED_ANNOUNCEMENTS = 5;

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
//
// A meeting's score is entirely: base points for its category, plus the
// premium-client bonus. Timeliness scoring (early-submission bonus, late
// -submission penalty) and its threshold settings were removed along with the
// unused duplicate-window rule — v2 is the marker for that change, so awards
// stamped v1 can still be recognised as having used the old formula.
export const DEFAULT_POINTS_RULES = Object.freeze({
  version: 'v2',
  // One entry per MEETING_TYPES value — this is what decides a meeting's worth.
  base: { ONE_TO_ONE: 10, GROUP: 25, DIRECT_CONVERSION: 15 },
  bonuses: { premiumClient: 20 },
  rejected: 0,
  // Not a points rule: a pending review is "aged"/SLA-breached once it has
  // waited longer than this. Used by the review queue and dashboard.
  approvalSlaHours: 24,
});
