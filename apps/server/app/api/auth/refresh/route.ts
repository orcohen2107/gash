import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { handleApiError } from '@/lib/apiError'
import { getRequestLogContext, logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Refresh token required' } },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })

    if (error || !data.session) {
      logger.warn('auth.refresh_failed', getRequestLogContext(request, '/api/auth/refresh'))
      return NextResponse.json(
        { error: { code: 'REFRESH_FAILED', message: 'Failed to refresh session' } },
        { status: 401 }
      )
    }

    logger.info('auth.session_refreshed', {
      ...getRequestLogContext(request, '/api/auth/refresh'),
      userId: data.user?.id,
    })

    return NextResponse.json({
      session: data.session,
      accessToken: data.session.access_token,
    })
  } catch (error) {
    return handleApiError(error, getRequestLogContext(request, '/api/auth/refresh'))
  }
}
