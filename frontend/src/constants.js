// Mirrors backend/src/config/constants.js — keep in sync.
export const ROLES = { ADMIN: 'ADMIN', MANAGER: 'MANAGER', USER: 'USER' };

export const MEETING_TYPES = { ONE_TO_ONE: 'ONE_TO_ONE', GROUP: 'GROUP', DIRECT_CONVERSION: 'DIRECT_CONVERSION' };

// Mirrors backend/src/config/constants.js — for a live preview only; the
// server always derives the authoritative stacking type from stakingVolume.
export const STAKING_VOLUME_THRESHOLD = 100000;

export const MEETING_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  MODIFICATION_REQUESTED: 'MODIFICATION_REQUESTED',
};

export const INTEREST_LEVELS = { HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' };

export const LEADERBOARD_SCOPES = { ALLTIME: 'ALLTIME', WEEKLY: 'WEEKLY', MONTHLY: 'MONTHLY' };

export const STATUS_LABEL = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  MODIFICATION_REQUESTED: 'Needs changes',
};

export const ANNOUNCEMENT_TYPES = { IMAGE: 'IMAGE', TEXT: 'TEXT', DOCUMENT: 'DOCUMENT' };

export const ANNOUNCEMENT_CATEGORIES = {
  GENERAL: 'GENERAL',
  EVENT: 'EVENT',
  CIRCULAR: 'CIRCULAR',
  TRAINING: 'TRAINING',
  WORKSHOP: 'WORKSHOP',
  MEETING: 'MEETING',
  EMERGENCY: 'EMERGENCY',
  NEWS: 'NEWS',
};

export const ANNOUNCEMENT_CATEGORY_LABEL = {
  GENERAL: 'General',
  EVENT: 'Event',
  CIRCULAR: 'Circular',
  TRAINING: 'Training',
  WORKSHOP: 'Workshop',
  MEETING: 'Meeting',
  EMERGENCY: 'Emergency',
  NEWS: 'News',
};

export const ANNOUNCEMENT_PRIORITY = { NORMAL: 'NORMAL', IMPORTANT: 'IMPORTANT', URGENT: 'URGENT' };

export const ANNOUNCEMENT_STATUS = { DRAFT: 'DRAFT', SCHEDULED: 'SCHEDULED', PUBLISHED: 'PUBLISHED' };

export const ANNOUNCEMENT_ANIMATION = { NONE: 'NONE', POPUP: 'POPUP' };

export const TOKEN_KEY = 'ff_token';
