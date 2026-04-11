import { useEffect, useMemo, type ComponentProps } from 'react'
import { Tabs, Redirect, useSegments } from 'expo-router'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/useAuthStore'
import { isMainTab, useTabHistoryStore } from '@/stores/useTabHistoryStore'
import { tabBarElevationStyle } from '@/lib/responsiveLayout'

const ACTIVE = '#81ecff'
const INACTIVE = '#adaaaa'
const BAR_BG = 'rgba(32, 32, 31, 0.96)'

type TabName = 'tips' | 'dashboard' | 'log' | 'journal' | 'coach'

const TAB_LABEL: Record<TabName, string> = {
  tips: 'טיפים',
  dashboard: 'מדדים',
  log: 'תיעוד',
  journal: 'יומן',
  coach: 'מאמן',
}

const TAB_ICON = {
  tips: 'tips-and-updates',
  dashboard: 'leaderboard',
  log: 'add-circle',
  journal: 'menu-book',
  coach: 'smart-toy',
} as const satisfies Record<TabName, ComponentProps<typeof MaterialIcons>['name']>

function isTabName(name: string): name is TabName {
  return name in TAB_LABEL
}

export default function TabLayout() {
  const insets = useSafeAreaInsets()
  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)
  const segments = useSegments()
  const setLastNonProfile = useTabHistoryStore((s) => s.setLastNonProfile)

  /**
   * גובה סרגל הטאבים — minHeight ולא height קשוח, כדי שלא ייחתך תוכן (איקון+תווית).
   * tabBarItemStyle עם minWidth: 0 — חשוב ב-RTL עם 5 טאבים וטקסט עברי: בלי זה flex
   * לא מצמצם פריטים והטאב האחרון (מאמן) נדחף מחוץ למסך.
   */
  const tabBarStyle = useMemo(() => {
    const paddingTop = 8
    const rowMin = 56
    const bottomInset = Math.max(
      insets.bottom,
      Platform.OS === 'android' ? 10 : 6
    )
    return {
      backgroundColor: BAR_BG,
      borderTopWidth: 1,
      borderTopColor: 'rgba(72, 72, 71, 0.15)',
      minHeight: paddingTop + rowMin + bottomInset,
      paddingTop,
      paddingBottom: bottomInset,
      ...tabBarElevationStyle(),
    }
  }, [insets.bottom])

  useEffect(() => {
    if (loading || !session) return
    const segs = segments as readonly string[]
    const tab = segs.length > 1 ? segs[1] : undefined
    if (tab && isMainTab(tab)) {
      setLastNonProfile(tab)
    }
  }, [segments, loading, session, setLastNonProfile])

  if (loading) return null
  if (!session) return <Redirect href="/auth" />

  return (
    <Tabs
      initialRouteName="tips"
      screenOptions={({ route }) => {
        const name = route.name
        const tabKey = isTabName(name) ? name : 'tips'
        const label = TAB_LABEL[tabKey] ?? name
        const iconName = TAB_ICON[tabKey] ?? 'circle'
        const logLarge = tabKey === 'log'

        return {
          headerShown: false,
          title: label,
          tabBarLabel: label,
          tabBarActiveTintColor: ACTIVE,
          tabBarInactiveTintColor: INACTIVE,
          tabBarHideOnKeyboard: false,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            marginTop: 2,
          },
          tabBarStyle,
          tabBarItemStyle: { flex: 1, minWidth: 0, paddingVertical: 4 },
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons
              name={iconName}
              size={logLarge ? Math.max(size ?? 24, 28) : (size ?? 24)}
              color={color}
            />
          ),
        }
      }}
    >
      <Tabs.Screen name="tips" />
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="log" />
      <Tabs.Screen name="journal" />
      <Tabs.Screen name="coach" />
    </Tabs>
  )
}
