import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { runOnboardingAgent } from '@/lib/agents/onboarding'
import { handleApiError } from '@/lib/apiError'
import { OnboardingRequestSchema } from '@gash/schemas'
import type { OnboardingRequest } from '@gash/types'

export async function POST(request: NextRequest) {
  try {
    await verifyAuth(request)
    const body = await request.json()
    const validated = OnboardingRequestSchema.parse(body)
    const result = await runOnboardingAgent(validated.messages, validated.onboardingStep)
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
