import { useEffect } from 'react'
import { I18nManager } from 'react-native'
import { Stack } from 'expo-router'
import * as Updates from 'expo-updates'
import { useSettingsStore } from '@/stores/useSettingsStore'

export default function RootLayout() {
  const rtlInitialized = useSettingsStore((s) => s.rtlInitialized)
  const setRtlInitialized = useSettingsStore((s) => s.setRtlInitialized)

  useEffect(() => {
    // RTL must be forced before any component renders on first launch.
    // Guard: only run once (rtlInitialized persists across restarts via AsyncStorage).
    // NOTE: Updates.reloadAsync() does NOT work in Expo Go dev mode — it throws.
    // In dev: RTL takes effect on next cold start. In standalone: automatic reload.
    if (!rtlInitialized) {
      I18nManager.allowRTL(true)
      I18nManager.forceRTL(true)
      setRtlInitialized(true)
      Updates.reloadAsync().catch(() => {
        // Expected failure in Expo Go dev mode — safe to ignore
      })
    }
  }, [rtlInitialized, setRtlInitialized])

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
  )
}
