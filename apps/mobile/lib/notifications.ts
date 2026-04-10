import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { SERVER_URL, getAuthHeaders } from '@/lib/server'

// Configure notification handler to be called when notification is tapped
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null
  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return null

  let token: string
  try {
    token = (await Notifications.getExpoPushTokenAsync()).data
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const isNetwork =
      msg.includes('Network request failed') || msg.includes('fetch')
    if (__DEV__) {
      console.warn(
        '[push] Expo push token unavailable (network / Expo Go / simulator):',
        msg
      )
    } else if (!isNetwork) {
      console.error('[push] Failed to get push token:', err)
    }
    return null
  }

  // Store token on server immediately after obtaining it
  try {
    await storeExposePushToken(token)
  } catch (err) {
    console.error('Failed to store push token:', err)
    // Don't throw — non-blocking if token storage fails
  }

  return token
}

export async function storeExposePushToken(token: string): Promise<void> {
  try {
    const response = await fetch(`${SERVER_URL}/api/user/push-token`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ expo_push_token: token }),
    })
    if (!response.ok) {
      throw new Error(`Failed to store push token: ${response.status}`)
    }
  } catch (err) {
    console.error('Failed to store push token:', err)
    throw err
  }
}

export async function sendLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  })
}

/**
 * Handle notification responses (when user taps a notification)
 * Used for deep linking to relevant screens based on notification type
 */
export function setupNotificationResponseHandler(handler: (response: Notifications.NotificationResponse) => void) {
  const subscription = Notifications.addNotificationResponseReceivedListener(handler)
  return subscription
}
