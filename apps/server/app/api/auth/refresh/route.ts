import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { handleApiError } from '@/lib/apiError'

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
      return NextResponse.json(
        { error: { code: 'REFRESH_FAILED', message: 'Failed to refresh session' } },
        { status: 401 }
      )
    }

    return NextResponse.json({
      session: data.session,
      accessToken: data.session.access_token,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
