import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/apiError'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request)

    const body = await request.json()

    if (!body.expo_push_token || typeof body.expo_push_token !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid expo_push_token' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('users')
      .update({ expo_push_token: body.expo_push_token })
      .eq('id', userId)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Push token stored' })
  } catch (error) {
    return handleApiError(error)
  }
}
