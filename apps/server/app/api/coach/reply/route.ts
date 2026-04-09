import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { buildUserContext } from '@/lib/agents/buildUserContext'
import { runReplyCoachAgent } from '@/lib/agents/replyCoach'
import { handleApiError } from '@/lib/apiError'
import { ReplyCoachRequestSchema } from '@gash/schemas'
import type { ReplyCoachRequest } from '@gash/types'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request)
    const body = await request.json()
    const validated = ReplyCoachRequestSchema.parse(body)
    const supabase = createServiceClient()
    const ctx = await buildUserContext(userId, supabase)
    const result = await runReplyCoachAgent(validated as ReplyCoachRequest, ctx)
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
