import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAuth } from '@/lib/auth'
import { sendPushNotificationToUser } from '@/lib/pushNotifications'
import { handleApiError } from '@/lib/apiError'
import { getRequestLogContext, logger } from '@/lib/logger'
import { incrementUserStreak, loadCurrentStreak } from '@/lib/streak'

const StreakRequestSchema = z.object({
  action: z.enum(['increment']),
})

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const streak = await loadCurrentStreak(auth.userId)
    return NextResponse.json({ streak })
  } catch (error) {
    return handleApiError(error, getRequestLogContext(request, '/api/user/streak'))
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = auth.userId

    const body = await request.json()
    const validated = StreakRequestSchema.parse(body)
    const { action } = validated

    if (action === 'increment') {
      const { previousStreak, streak } = await incrementUserStreak(userId)

      // Send push notification on milestone streaks (7, 14, 21, etc.)
      if (streak > previousStreak && streak > 0 && streak % 7 === 0) {
        const milestoneMessage = `🔥 רצף שבועי! ${streak} ימים רצופים — כל הכבוד!`
        await sendPushNotificationToUser({
          userId,
          title: 'הישג חדש!',
          body: milestoneMessage,
          notificationType: 'streak_milestone',
          data: {
            screen: '/(tabs)/dashboard',
            streak,
          },
        }).catch((err) => {
          logger.error('streak.milestone_push_failed', {
            ...getRequestLogContext(request, '/api/user/streak'),
            userId,
            streak,
            error: err,
          })
          // Non-blocking — don't fail the API if push notification fails
        })
      }

      logger.info('streak.updated', {
        ...getRequestLogContext(request, '/api/user/streak'),
        userId,
        previousStreak,
        newStreak: streak,
      })

      return NextResponse.json({
        streak,
        message: streak > previousStreak ? '+1 🔥' : 'הרצף עודכן',
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return handleApiError(error, getRequestLogContext(request, '/api/user/streak'))
  }
}
