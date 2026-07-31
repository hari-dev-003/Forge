import { z } from 'zod';
import {
  MEETING_TYPES,
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

export const presignSchema = z.object({
  contentType: z.string().default('image/jpeg'),
  prefix: z.enum(['photos', 'announcements']).optional().default('photos'),
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

export const createMeetingSchema = z
  .object({
    type: z.enum([MEETING_TYPES.ONE_TO_ONE, MEETING_TYPES.GROUP, MEETING_TYPES.DIRECT_CONVERSION]),
    photo: z.object({ key: z.string().min(1), caption: z.string().optional().default('') }),
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
  );

export const decisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', 'REQUEST_MODIFICATION']),
  reason: z.string().max(500).optional(),
  qualityScore: z.number().int().min(1).max(5).optional(),
});

export const pointsRulesSchema = z.object({
  version: z.string(),
  base: z.object({ ONE_TO_ONE: z.number(), GROUP: z.number() }),
  bonuses: z.object({ premiumClient: z.number(), earlySubmission: z.number() }),
  penalties: z.object({ lateSubmission: z.number() }),
  rejected: z.number().default(0),
  earlySubmissionBeforeHour: z.number().min(0).max(23).default(12),
  lateSubmissionAfterHours: z.number().min(0).default(24),
  duplicateWindowDays: z.number().min(0).default(7),
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
});
