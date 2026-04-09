import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { runOnboardingAgent } from '@/lib/agents/onboarding'
import { handleApiError } from '@/lib/apiError'
import type { OnboardingRequest } from '@gash/types'

export async function POST(request: NextRequest) {
  try {
    await verifyAuth(request)
    const body = await request.json() as OnboardingRequest
    const result = await runOnboardingAgent(body.messages, body.onboardingStep)
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
