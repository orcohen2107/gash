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
import type { CoachRequest, ApproachFeedbackRequest, DebriefRequest } from '@gash/types'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request)
    const body = await request.json()
    const supabase = createServiceClient()
    const ctx = await buildUserContext(userId, supabase)

    if (body.type === 'approach-feedback') {
      const result = await runApproachFeedbackAgent(body as ApproachFeedbackRequest, ctx)
      return NextResponse.json(result)
    }

    if (body.type === 'debrief') {
      const result = await runDebriefAgent(body as DebriefRequest, ctx)
      return NextResponse.json(result)
    }

    if (body.type === 'boost') {
      const result = await runBoostAgent(body.situation, ctx)
      return NextResponse.json(result)
    }

    const coachReq = body as CoachRequest
    const lastUserMessage = coachReq.messages.findLast((m) => m.role === 'user')?.content ?? ''
    const intent = detectIntent(lastUserMessage)

    if (intent === 'boost') {
      const result = await runBoostAgent(lastUserMessage, ctx)
      return NextResponse.json(result)
    }

    const result = await runCoachAgent(coachReq.messages, ctx)
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
