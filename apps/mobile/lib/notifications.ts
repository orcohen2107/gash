import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null
  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return null
  const token = (await Notifications.getExpoPushTokenAsync()).data
  return token
}

export async function sendLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  })
}
