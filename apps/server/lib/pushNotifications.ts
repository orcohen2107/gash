/**
 * Expo Push Notifications Service
 * Sends remote push notifications to users via Expo
 * Documentation: https://docs.expo.dev/push-notifications/sending-notifications/
 */

import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export interface PushNotificationPayload {
  to: string // Expo push token (ExponentPushToken[...])
  sound?: string
  title: string
  body: string
  data?: Record<string, any> // Custom data for deep linking
}

/**
 * Send a push notification to a single device
 * @param payload Push notification payload
 * @returns Promise<boolean> whether send was successful
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<boolean> {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: payload.to,
        sound: payload.sound || 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data,
        ttl: 86400, // 24 hours in seconds
        expiration: Math.floor(Date.now() / 1000) + 86400,
        priority: 'high',
      }),
    })

    if (!response.ok) {
      logger.error('push.expo_send_failed', {
        status: response.status,
        responseText: await response.text(),
      })
      return false
    }

    const result = await response.json()
    logger.info('push.expo_sent', { result })
    return true
  } catch (err) {
    logger.error('push.send_failed', { error: err })
    return false
  }
}

/**
 * Send push notification to a user by user_id
 * Looks up their push token and sends notification
 */
export async function sendPushNotificationToUser({
  userId,
  title,
  body,
  data,
  notificationType,
}: {
  userId: string
  title: string
  body: string
  data?: Record<string, any>
  notificationType: 'streak_milestone' | 'mission_new' | 'insights_ready' | 'engagement'
}): Promise<boolean> {
  try {
    // Fetch user's push token
    const { data: user, error } = await supabaseAdmin.from('users').select('expo_push_token').eq('id', userId).single()

    if (error || !user?.expo_push_token) {
      logger.warn('push.token_missing', { userId, error })
      return false
    }

    // Send notification
    const success = await sendPushNotification({
      to: user.expo_push_token,
      title,
      body,
      data,
    })

    // Log notification in push_notifications table if successful
    if (success) {
      await supabaseAdmin.from('push_notifications').insert({
        user_id: userId,
        type: notificationType,
        title,
        body,
        data,
        sent_at: new Date().toISOString(),
      })
      logger.info('push.notification_recorded', { userId, notificationType })
    }

    return success
  } catch (err) {
    logger.error('push.send_to_user_failed', { userId, notificationType, error: err })
    return false
  }
}

/**
 * Send push notification to multiple users
 * For engagement campaigns, milestone announcements, etc.
 */
export async function sendBroadcastPushNotification({
  userIds,
  title,
  body,
  data,
  notificationType,
}: {
  userIds: string[]
  title: string
  body: string
  data?: Record<string, any>
  notificationType: 'engagement'
}): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (const userId of userIds) {
    const success = await sendPushNotificationToUser({
      userId,
      title,
      body,
      data,
      notificationType,
    })

    if (success) {
      sent++
    } else {
      failed++
    }

    // Rate limit: small delay between sends to avoid overwhelming Expo API
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return { sent, failed }
}
