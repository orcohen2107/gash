import { useEffect } from 'react'
import { I18nManager, View } from 'react-native'
import { Slot, Redirect, useRouter } from 'expo-router'
import * as Updates from 'expo-updates'
import * as Notifications from 'expo-notifications'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { OfflineBanner } from '@/components/OfflineBanner'
import { useNetworkStatus, isOffline } from '@/lib/useNetworkStatus'
import { registerForPushNotifications, setupNotificationResponseHandler } from '@/lib/notifications'
import { analytics } from '@/lib/analytics'
import { supabase } from '@/lib/supabase'

export default function RootLayout() {
  const router = useRouter()
  const rtlInitialized = useSettingsStore((s) => s.rtlInitialized)
  const setRtlInitialized = useSettingsStore((s) => s.setRtlInitialized)

  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)
  const setSession = useAuthStore((s) => s.setSession)
  const setLoading = useAuthStore((s) => s.setLoading)

  const networkState = useNetworkStatus()
  const offline = isOffline(networkState)

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

  // Register for push notifications and initialize analytics when user is authenticated
  useEffect(() => {
    if (!session?.user?.id) return

    ;(async () => {
      try {
        // Initialize analytics
        await analytics.initialize(session.user.id)

        // Register for push notifications
        await registerForPushNotifications()
      } catch (err) {
        console.error('Failed to initialize notifications/analytics:', err)
      }
    })()

    // Setup notification response handler for deep linking
    const notificationResponseSubscription = setupNotificationResponseHandler((response) => {
      const { data } = response.notification.request.content

      // Handle deep linking based on notification type
      if (data?.screen) {
        router.push(data.screen)
      }
    })

    return () => {
      notificationResponseSubscription.remove()
    }
  }, [session, router])

  if (loading) {
    return null
  }

  if (!session) {
    return <Redirect href="/auth" />
  }

  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }}>
        <OfflineBanner isOffline={offline} />
        <Slot />
      </View>
    </ErrorBoundary>
  )
}
