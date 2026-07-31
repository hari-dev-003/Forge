import { z } from 'zod';
import {
  MEETING_TYPES,
  MEETING_PHOTO_MAX,
  MEETING_STATUS,
  INTEREST_LEVELS,
  LEADERBOARD_SCOPES,
  ROLES,
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_PRIORITY,
  ANNOUNCEMENT_ANIMATION,
} from '../config/constants.js';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const strongPassword = z
  .string()
  .min(8)
  .max(72)
  .regex(/[a-z]/, 'Password needs a lowercase letter')
  .regex(/[A-Z]/, 'Password needs an uppercase letter')
  .regex(/[0-9]/, 'Password needs a number')
  .regex(/[^a-zA-Z0-9]/, 'Password needs a symbol');

// Provisioning — the actor's own role decides what's actually created
// (userService.createUser): Admin creates a Manager (with a password they
// set themselves, no forced change); Manager creates a User (password is
// auto-generated server-side and never accepted from the client here).
// The `role` a caller may create isn't client-supplied at all — it's derived
// from the actor — so it's intentionally absent from this schema.
export const createUserSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: strongPassword.optional(), // required for Admin->Manager only; ignored for Manager->User
  city: z.string().optional().nullable(),
});

export const completeNewPasswordSchema = z.object({
  email: z.string().email(),
  newPassword: strongPassword,
  session: z.string().min(1),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  city: z.string().optional().nullable(),
  active: z.boolean().optional(),
  managerId: z.string().optional().nullable(),
});

// `.default()` only fires on `undefined`, so an empty-string contentType used
// to sail through and get baked into the S3 signature. The browser then sent
// its own sniffed Content-Type on the PUT, the signature no longer matched,
// and S3 answered 403 SignatureDoesNotMatch — which surfaced as a bare
// "403 (Forbidden)" while publishing an announcement with an attachment.
// Windows hands the file picker an empty `File.type` for plenty of real
// files (.zip, .msg, extension-less), so this was easy to hit.
const contentTypeSchema = z
  .string()
  .transform((v) => v.trim())
  .refine((v) => v === '' || /^[\w.+-]+\/[\w.+-]+$/.test(v), 'Invalid content type')
  .transform((v) => v || 'application/octet-stream');

export const presignSchema = z.object({
  contentType: contentTypeSchema.optional().default('image/jpeg'),
  prefix: z.enum(['photos', 'announcements']).optional().default('photos'),
  // Optional — lets the stored object keep the original extension when the
  // browser could not determine a content type.
  filename: z.string().max(255).optional(),
});

const oneToOne = z.object({
  name: z.string().min(1),
  phone: z.string().optional().default(''),
  city: z.string().optional().default(''),
});

const groupMember = z.object({
  name: z.string().min(1),
  phone: z.string().optional().default(''),
  city: z.string().optional().default(''),
});

// Group meetings now capture named individual attendee details (2-6 people)
// instead of a free-form headcount.
const group = z.object({
  name: z.string().min(1),
  attendeeList: z.array(groupMember).min(2).max(6),
});

// Direct Conversion — a crypto-staking referral conversion, logged like any
// other meeting type. "stackingType" (BVS/ESP) is intentionally NOT accepted
// here — it's always derived server-side from stakingVolume (meetingService)
// so it can never be mismatched or spoofed by the client.
const directConversion = z.object({
  name: z.string().min(1),
  businessCentre: z.string().min(1),
  nexusMailId: z.string().email(),
  phone: z.string().min(1),
  stakingVolume: z.coerce.number().min(0),
  screenshot: z.object({ key: z.string().min(1) }),
});

const meetingPhoto = z.object({
  key: z.string().min(1),
  caption: z.string().optional().default(''),
});

export const createMeetingSchema = z
  .object({
    type: z.enum([MEETING_TYPES.ONE_TO_ONE, MEETING_TYPES.GROUP, MEETING_TYPES.DIRECT_CONVERSION]),
    // 1–3 proof photos, for every meeting type. `photo` (singular) is the
    // original single-photo field, still accepted so an older client — or a
    // request replayed from before this change — keeps working; the transform
    // below collapses both spellings into `photos`.
    photos: z.array(meetingPhoto).min(1).max(MEETING_PHOTO_MAX).optional(),
    photo: meetingPhoto.optional(),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    isPremiumClient: z.boolean().optional().default(false),
    occurredAt: z.string().datetime().optional(),
    customer: oneToOne.optional(),
    group: group.optional(),
    directConversion: directConversion.optional(),
    business: z
      .object({
        purpose: z.string().optional().default(''),
        interestLevel: z.enum([INTEREST_LEVELS.HIGH, INTEREST_LEVELS.MEDIUM, INTEREST_LEVELS.LOW]).optional().nullable(),
        followUpRequired: z.boolean().optional().default(false),
        priority: z.string().optional().nullable(),
        outcome: z.string().optional().default(''),
        remarks: z.string().optional().default(''),
      })
      .optional()
      .default({}),
  })
  .refine(
    (d) => {
      if (d.type === MEETING_TYPES.ONE_TO_ONE) return !!d.customer;
      if (d.type === MEETING_TYPES.GROUP) return !!d.group;
      return !!d.directConversion;
    },
    { message: 'Provide the details required for the selected meeting type' }
  )
  .refine((d) => (d.photos?.length ?? 0) > 0 || !!d.photo, {
    message: `At least one meeting photo is required (up to ${MEETING_PHOTO_MAX}).`,
    path: ['photos'],
  })
  // Normalise to a single shape so nothing downstream has to care which
  // spelling arrived. `photo` is kept in sync as the first photo — existing
  // stored meetings only have that field and the UI still reads it.
  .transform((d) => {
    const photos = d.photos?.length ? d.photos : [d.photo];
    return { ...d, photos, photo: photos[0] };
  });

export const decisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', 'REQUEST_MODIFICATION']),
  reason: z.string().max(500).optional(),
  qualityScore: z.number().int().min(1).max(5).optional(),
});

// The single source of truth for what an approved meeting is worth.
//
// `base` MUST list every MEETING_TYPES value: Zod strips unknown keys, so a
// missing entry here means the admin's configured value for that category is
// silently discarded on save and the engine keeps scoring it at the built-in
// default. DIRECT_CONVERSION was missing, which is exactly what happened to it.
export const pointsRulesSchema = z.object({
  version: z.string(),
  base: z.object({
    ONE_TO_ONE: z.number(),
    GROUP: z.number(),
    DIRECT_CONVERSION: z.number(),
  }),
  bonuses: z.object({ premiumClient: z.number() }),
  rejected: z.number().default(0),
  // Not a points rule — drives review-queue/dashboard SLA ageing. Kept out of
  // the points config UI, which is why it survives the threshold removal.
  approvalSlaHours: z.number().min(0).default(24),
});

export const leaderboardQuerySchema = z.object({
  scope: z
    .enum([LEADERBOARD_SCOPES.ALLTIME, LEADERBOARD_SCOPES.WEEKLY, LEADERBOARD_SCOPES.MONTHLY])
    .default(LEADERBOARD_SCOPES.ALLTIME),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const queueQuerySchema = z.object({
  status: z
    .enum([
      MEETING_STATUS.PENDING,
      MEETING_STATUS.APPROVED,
      MEETING_STATUS.REJECTED,
      MEETING_STATUS.MODIFICATION_REQUESTED,
    ])
    .default(MEETING_STATUS.PENDING),
});

export const auditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
  actorId: z.string().optional(),
  action: z.string().optional(),
});

const attachmentSchema = z.object({
  key: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().min(0).optional(),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(2).max(200),
  category: z.enum(Object.values(ANNOUNCEMENT_CATEGORIES)),
  type: z.enum(Object.values(ANNOUNCEMENT_TYPES)),
  description: z.string().max(20000).optional().default(''),
  attachments: z.array(attachmentSchema).max(10).optional().default([]),
  targetRoles: z.array(z.enum([ROLES.MANAGER, ROLES.USER])).optional(),
  priority: z.enum(Object.values(ANNOUNCEMENT_PRIORITY)).optional(),
  isPinned: z.boolean().optional().default(false),
  // Admin's intent, not the stored status — announcementService maps this to
  // DRAFT/PUBLISHED/SCHEDULED (+ validates SCHEDULE requires a publishDate).
  status: z.enum(['DRAFT', 'PUBLISH_NOW', 'SCHEDULE']).optional().default('PUBLISH_NOW'),
  publishDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional().nullable(),
  animationType: z.enum(Object.values(ANNOUNCEMENT_ANIMATION)).optional(),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  category: z.enum(Object.values(ANNOUNCEMENT_CATEGORIES)).optional(),
  type: z.enum(Object.values(ANNOUNCEMENT_TYPES)).optional(),
  description: z.string().max(20000).optional(),
  attachments: z.array(attachmentSchema).max(10).optional(),
  targetRoles: z.array(z.enum([ROLES.MANAGER, ROLES.USER])).optional(),
  priority: z.enum(Object.values(ANNOUNCEMENT_PRIORITY)).optional(),
  isPinned: z.boolean().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']).optional(),
  publishDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional().nullable(),
  animationType: z.enum(Object.values(ANNOUNCEMENT_ANIMATION)).optional(),
});

export const announcementQuerySchema = z.object({
  category: z.enum(Object.values(ANNOUNCEMENT_CATEGORIES)).optional(),
  priority: z.enum(Object.values(ANNOUNCEMENT_PRIORITY)).optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(['latest', 'oldest', 'mostViewed']).optional().default('latest'),
  // `validate` REPLACES req.query with the parsed object, so anything missing
  // here is dropped before the controller runs. `view` was missing, which made
  // `req.query.view === 'manage'` permanently false — the admin management
  // table silently fell back to the viewer feed and never listed drafts or
  // expired announcements.
  view: z.enum(['manage']).optional(),
});
