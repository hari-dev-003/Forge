import { z } from 'zod';
import {
  ROLES,
  MEETING_TYPES,
  MEETING_STATUS,
  INTEREST_LEVELS,
  LEADERBOARD_SCOPES,
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

// Admin-only provisioning — managers only. Field users self-signup (see below);
// there is no admin-create path for them anymore.
export const createUserSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: strongPassword,
  role: z.literal(ROLES.MANAGER),
  region: z.string().optional().nullable(),
});

// Public self-signup — always a field user, activated via Cognito's emailed
// verification code (see confirmSignupSchema), not admin approval.
export const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: strongPassword,
  userId: z.string().min(1).max(40),
});

export const confirmSignupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  userId: z.string().min(1).max(40),
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code from your email'),
});

export const resendSignupCodeSchema = z.object({
  email: z.string().email(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  region: z.string().optional().nullable(),
  active: z.boolean().optional(),
  managerId: z.string().optional().nullable(),
});

export const presignSchema = z.object({
  contentType: z.string().default('image/jpeg'),
});

const oneToOne = z.object({
  name: z.string().min(1),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
});

const group = z.object({
  name: z.string().min(1),
  attendees: z.coerce.number().int().min(0).default(0),
  attendeeList: z.array(z.string()).optional().default([]),
});

export const createMeetingSchema = z
  .object({
    type: z.enum([MEETING_TYPES.ONE_TO_ONE, MEETING_TYPES.GROUP]),
    photo: z.object({ key: z.string().min(1), caption: z.string().optional().default('') }),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    isPremiumClient: z.boolean().optional().default(false),
    occurredAt: z.string().datetime().optional(),
    customer: oneToOne.optional(),
    group: group.optional(),
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
  .refine((d) => (d.type === MEETING_TYPES.ONE_TO_ONE ? !!d.customer : !!d.group), {
    message: 'Provide customer details for one-to-one, or group details for group meetings',
  });

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
