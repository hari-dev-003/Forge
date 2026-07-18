// Mirrors backend/src/config/constants.js — keep in sync.
export const ROLES = { ADMIN: 'ADMIN', MANAGER: 'MANAGER', USER: 'USER' };

export const MEETING_TYPES = { ONE_TO_ONE: 'ONE_TO_ONE', GROUP: 'GROUP' };

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

export const TOKEN_KEY = 'ff_token';
