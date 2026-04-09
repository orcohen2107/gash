/**
 * POST /api/user/push-token
 * Store Expo push token for the authenticated user
 * Used to send remote push notifications
 *
 * Request body:
 * {
 *   "expo_push_token": "ExponentPushToken[...]"
 * }
 */

import { createUserClient } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/apiError'

const pushTokenSchema = {
  expo_push_token: {
    type: 'string',
    pattern: '^ExponentPushToken\\[.+\\]$',
  },
}

export async function POST(request: Request) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await request.json()

    // Basic validation
    if (!body.expo_push_token || typeof body.expo_push_token !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid expo_push_token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createUserClient(request)

    // Update user's push token in database
    const { error } = await supabase
      .from('users')
      .update({ expo_push_token: body.expo_push_token })
      .eq('id', user.id)

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Push token stored' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return handleApiError(error, 'Failed to store push token')
  }
}
