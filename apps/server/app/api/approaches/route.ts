import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { handleApiError } from '@/lib/apiError'
import { createRateLimitResponse } from '@/lib/rateLimit'
import { CreateApproachSchema } from '@gash/schemas'
import { runApproachFeedbackAgent } from '@/lib/agents/approachFeedback'
import { buildUserContext } from '@/lib/agents/buildUserContext'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request)

    // Rate limit: 50 requests per minute for data endpoints
    const rateLimitResponse = createRateLimitResponse(`approaches:${userId}:get`, {
      limit: 50,
    })
    if (rateLimitResponse) return rateLimitResponse
    const supabase = createServiceClient()

    const url = new URL(request.url)
    const approachType = url.searchParams.get('approach_type')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const search = url.searchParams.get('search')

    let query = supabase
      .from('approaches')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('date', { ascending: false })

    if (approachType) query = query.eq('approach_type', approachType)
    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)
    if (search) query = query.ilike('location', `%${search}%`)

    const { data, error } = await query

    if (error) throw new Error(error.message)

    return NextResponse.json({ approaches: data })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request)

    // Rate limit: 20 requests per minute for approach creation
    const rateLimitResponse = createRateLimitResponse(`approaches:${userId}:post`, {
      limit: 20,
    })
    if (rateLimitResponse) return rateLimitResponse
    const body = await request.json()
    const parsed = CreateApproachSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    const { data: approach, error } = await supabase
      .from('approaches')
      .insert({ ...parsed.data, user_id: userId })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Get AI feedback
    const userContext = await buildUserContext(userId, supabase)
    const feedbackResponse = await runApproachFeedbackAgent(
      { type: 'approach-feedback', approach },
      userContext
    )

    return NextResponse.json(
      {
        id: approach.id,
        feedback: feedbackResponse.feedback,
        created_at: approach.created_at,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
