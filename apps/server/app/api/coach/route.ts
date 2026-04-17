import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { buildUserContext } from '@/lib/agents/buildUserContext'
import { runCoachAgent } from '@/lib/agents/coach'
import { runBoostAgent } from '@/lib/agents/boost'
import { runApproachFeedbackAgent } from '@/lib/agents/approachFeedback'
import { runDebriefAgent } from '@/lib/agents/debrief'
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

    // Default: coach request
    const validated = CoachRequestSchema.parse(body)
    const coachReq = validated as CoachRequest
    const lastUserMessage = coachReq.messages.findLast((m) => m.role === 'user')?.content ?? ''
    const intent = detectIntent(lastUserMessage)

    if (intent === 'boost') {
      const result = await runBoostAgent(lastUserMessage, ctx)
      logger.info('coach.agent_completed', {
        ...getRequestLogContext(request, '/api/coach'),
        userId,
        agentType: 'boost',
        detectedIntent: intent,
      })
      return NextResponse.json(result)
    }

    const result = await runCoachAgent(coachReq.messages, ctx)
    if (lastUserMessage.trim().length > 0) {
      const now = new Date().toISOString()
      const { error: messageSaveError } = await supabase.from('chat_messages').insert([
        {
          user_id: userId,
          role: 'user',
          content: lastUserMessage,
          created_at: now,
        },
        {
          user_id: userId,
          role: 'assistant',
          content: result.text,
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
      agentType: 'coach',
      messageSaved: lastUserMessage.trim().length > 0,
    })
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error, getRequestLogContext(request, '/api/coach'))
  }
}
