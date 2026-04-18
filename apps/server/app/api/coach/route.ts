import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { buildUserContext } from '@/lib/agents/buildUserContext'
import { runCoachAgent } from '@/lib/agents/coach'
import { runBoostAgent } from '@/lib/agents/boost'
import { runApproachFeedbackAgent } from '@/lib/agents/approachFeedback'
import { runDebriefAgent } from '@/lib/agents/debrief'
import { runPracticeAgent } from '@/lib/agents/practice'
import { runDebriefChatAgent } from '@/lib/agents/debriefChat'
import { detectIntent } from '@/lib/agents/router'
import { handleApiError } from '@/lib/apiError'
import { createRateLimitResponse } from '@/lib/rateLimit'
import { getRequestLogContext, logger } from '@/lib/logger'
import {
  CoachRequestSchema,
  ApproachFeedbackRequestSchema,
  DebriefRequestSchema,
  BoostRequestSchema,
} from '@gash/schemas'
import type { CoachRequest, ApproachFeedbackRequest, DebriefRequest } from '@gash/types'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request)

    // Rate limit: 10 requests per minute for coach endpoints
    const rateLimitResponse = await createRateLimitResponse(`coach:${userId}`, {
      limit: 10,
    })
    if (rateLimitResponse) return rateLimitResponse
    const body = await request.json()
    const supabase = createServiceClient()
    const ctx = await buildUserContext(userId, supabase)

    // Validate request body based on type
    if (body.type === 'approach-feedback') {
      const validated = ApproachFeedbackRequestSchema.parse(body)
      const result = await runApproachFeedbackAgent(validated as ApproachFeedbackRequest, ctx)
      logger.info('coach.agent_completed', {
        ...getRequestLogContext(request, '/api/coach'),
        userId,
        agentType: 'approach-feedback',
      })
      return NextResponse.json(result)
    }

    if (body.type === 'debrief') {
      const validated = DebriefRequestSchema.parse(body)
      const result = await runDebriefAgent(validated as DebriefRequest, ctx)
      logger.info('coach.agent_completed', {
        ...getRequestLogContext(request, '/api/coach'),
        userId,
        agentType: 'debrief',
      })
      return NextResponse.json(result)
    }

    if (body.type === 'boost') {
      const validated = BoostRequestSchema.parse(body)
      const result = await runBoostAgent(validated.situation, ctx)
      logger.info('coach.agent_completed', {
        ...getRequestLogContext(request, '/api/coach'),
        userId,
        agentType: 'boost',
      })
      return NextResponse.json(result)
    }

    // Coach request — route by explicit mode or detect intent
    const validated = CoachRequestSchema.parse(body)
    const coachReq = validated as CoachRequest
    const mode = coachReq.mode ?? 'coach'
    const isOpening = coachReq.messages.length === 0
    const lastUserMessage = coachReq.messages.findLast((m) => m.role === 'user')?.content ?? ''

    let result: { text: string; scenario?: string }
    let agentType: string

    if (mode === 'practice') {
      result = await runPracticeAgent(coachReq.messages, ctx, isOpening)
      agentType = 'practice'
    } else if (mode === 'debrief-chat') {
      result = await runDebriefChatAgent(coachReq.messages, ctx, isOpening)
      agentType = 'debrief-chat'
    } else {
      // Default coach mode — opening message without calling Claude
      if (isOpening) {
        const openingText = ctx.hasEnoughData
          ? `היי! על מה תרצה לדבר היום? אפשר לשאול על סיטואציה ספציפית, לבקש פתיחה מוכנה, או סתם לשוחח.`
          : `היי! אני גש — המאמן שלך. שאל אותי כל דבר — סיטואציה שנתקלת בה, איך לפתוח שיחה, מה להגיד אחרי. תתחיל 🙌`
        return NextResponse.json({ text: openingText })
      }

      // Existing intent detection for non-opening messages
      if (detectIntent(lastUserMessage) === 'boost') {
        const boostResult = await runBoostAgent(lastUserMessage, ctx)
        logger.info('coach.agent_completed', {
          ...getRequestLogContext(request, '/api/coach'),
          userId,
          agentType: 'boost',
          detectedIntent: 'boost',
        })
        return NextResponse.json(boostResult)
      }
      result = await runCoachAgent(coachReq.messages, ctx)
      agentType = 'coach'
    }

    // Persist messages — skip opening messages (no user input yet)
    if (!isOpening && lastUserMessage.trim().length > 0) {
      const now = new Date().toISOString()
      const { error: messageSaveError } = await supabase.from('chat_messages').insert([
        {
          user_id: userId,
          role: 'user',
          content: lastUserMessage,
          mode,
          created_at: now,
        },
        {
          user_id: userId,
          role: 'assistant',
          content: result.text,
          mode,
          created_at: new Date().toISOString(),
        },
      ])
      if (messageSaveError) {
        throw new Error(messageSaveError.message)
      }
    }

    logger.info('coach.agent_completed', {
      ...getRequestLogContext(request, '/api/coach'),
      userId,
      agentType,
      mode,
      isOpening,
      messageSaved: !isOpening && lastUserMessage.trim().length > 0,
    })
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error, getRequestLogContext(request, '/api/coach'))
  }
}
