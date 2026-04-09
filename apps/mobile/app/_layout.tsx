import { useEffect } from 'react'
import { I18nManager } from 'react-native'
import { Slot, Redirect } from 'expo-router'
import * as Updates from 'expo-updates'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { supabase } from '@/lib/supabase'

export default function RootLayout() {
  const rtlInitialized = useSettingsStore((s) => s.rtlInitialized)
  const setRtlInitialized = useSettingsStore((s) => s.setRtlInitialized)

  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)
  const setSession = useAuthStore((s) => s.setSession)
  const setLoading = useAuthStore((s) => s.setLoading)

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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [setSession, setLoading])

  if (loading) {
    return null
  }

  if (!session) {
    return <Redirect href="/auth" />
  }

  return <Slot />
}
