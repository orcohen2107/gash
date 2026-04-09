import { z } from 'zod'

export const ApproachTypeSchema = z.enum(['direct', 'situational', 'humor', 'online'])
export const FollowUpTypeSchema = z.enum(['meeting', 'text', 'instagram', 'nothing'])

export const ApproachSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  location: z.string().nullable(),
  approach_type: ApproachTypeSchema,
  opener: z.string().nullable(),
  response: z.string().nullable(),
  chemistry_score: z.number().min(1).max(10).nullable(),
  follow_up: FollowUpTypeSchema.nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
})

export const CreateApproachSchema = ApproachSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
})

export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
  created_at: z.string(),
})

export const CoachRequestSchema = z.object({
  type: z.literal('coach'),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
})

export const OnboardingRequestSchema = z.object({
  type: z.literal('onboarding'),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  onboardingStep: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
})

export const ReplyCoachRequestSchema = z.object({
  type: z.literal('reply-coach'),
  herMessage: z.string().optional(),
  thread: z.array(z.object({
    sender: z.string(),
    text: z.string(),
  })).optional(),
  context: z.object({
    where: z.string().optional(),
    duration: z.string().optional(),
    goal: z.string().optional(),
  }).optional(),
})

export const SituationOpenerRequestSchema = z.object({
  type: z.literal('situation-opener'),
  situation: z.string().min(1),
  context: z.string().optional(),
})

export const ApproachFeedbackRequestSchema = z.object({
  type: z.literal('approach-feedback'),
  approach: z.object({
    approach_type: ApproachTypeSchema,
    opener: z.string().nullable(),
    response: z.string().nullable(),
    chemistry_score: z.number().min(1).max(10).nullable(),
    follow_up: FollowUpTypeSchema.nullable(),
  }),
})

export const DebriefRequestSchema = z.object({
  type: z.literal('debrief'),
  approach: z.object({
    approach_type: ApproachTypeSchema,
    opener: z.string().nullable(),
    response: z.string().nullable(),
    chemistry_score: z.number().min(1).max(10).nullable(),
  }),
  debriefStep: z.union([z.literal(1), z.literal(2)]),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
})

export const BoostRequestSchema = z.object({
  type: z.literal('boost'),
  situation: z.string().min(1),
})

export const InsightsRequestSchema = z.object({
  type: z.literal('insights'),
})

export const AgentRequestSchema = z.discriminatedUnion('type', [
  CoachRequestSchema,
  OnboardingRequestSchema,
  ReplyCoachRequestSchema,
  SituationOpenerRequestSchema,
  ApproachFeedbackRequestSchema,
  DebriefRequestSchema,
  BoostRequestSchema,
  InsightsRequestSchema,
])
