import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { buildUserContext } from '@/lib/agents/buildUserContext'
import { runSituationOpenerAgent } from '@/lib/agents/situationOpener'
import { handleApiError } from '@/lib/apiError'
import type { SituationOpenerRequest } from '@gash/types'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request)
    const body = await request.json() as SituationOpenerRequest
    const supabase = createServiceClient()
    const ctx = await buildUserContext(userId, supabase)
    const result = await runSituationOpenerAgent(body, ctx)
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
