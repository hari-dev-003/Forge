// Mirrors backend/src/config/constants.js — keep in sync.
export const ROLES = { ADMIN: 'ADMIN', MANAGER: 'MANAGER', USER: 'USER' };

// Display names for the roles. The stored/API value for a field executive is
// still `USER` — only the wording shown to people changes, so never send these
// labels to the server or compare against them.
export const ROLE_LABEL = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.USER]: 'Executive',
};

export const roleLabel = (role) => ROLE_LABEL[role] || role;

export const MEETING_TYPES = { ONE_TO_ONE: 'ONE_TO_ONE', GROUP: 'GROUP', DIRECT_CONVERSION: 'DIRECT_CONVERSION' };

// The size ceiling for EVERY image uploaded anywhere in the app — meeting
// proof photos, the Direct Conversion screenshot, and image attachments on an
// announcement. Exactly this size is allowed; larger is not.
//
// Mirrors IMAGE_UPLOAD_MAX_BYTES in backend/src/config/constants.js. The server
// re-checks it against the object actually in the bucket, so this copy is the
// UX guard, not the enforcement.
export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Proof photos per meeting, for every meeting type.
export const MEETING_PHOTO_MAX = 3;

/** Human-readable byte size, e.g. "820 KB" / "4.2 MB". */
export const formatBytes = (b) =>
  b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

/**
 * Is this picked file an image? Falls back to the extension because Windows
 * hands the file picker an empty `File.type` for plenty of real files — and an
 * image that slipped through as "not an image" would skip the size cap.
 */
export const isImageFile = (file) =>
  !!file && (file.type?.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp|heic|heif|avif|tiff?)$/i.test(file.name || ''));

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
