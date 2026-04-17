import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { buildDashboardPayload } from '@/lib/dashboard/buildDashboardPayload'
import { createRateLimitResponse } from '@/lib/rateLimit'
import { handleApiError } from '@/lib/apiError'
import { getRequestLogContext, logger } from '@/lib/logger'

/** חבילה אחת למסך מדדים: גישות, KPI, תובנות, משימה שבועית */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request)

    const rateLimitResponse = await createRateLimitResponse(`dashboard:${userId}`, {
      limit: 30,
    })
    if (rateLimitResponse) return rateLimitResponse

    const payload = await buildDashboardPayload(userId)
    logger.info('dashboard.loaded', {
      ...getRequestLogContext(request, '/api/dashboard'),
      userId,
    })
    return NextResponse.json(payload)
  } catch (error) {
    return handleApiError(error, getRequestLogContext(request, '/api/dashboard'))
  }
}
