// app/(tabs)/_layout.tsx
// סדר: ב-RTL האלמנט הראשון ברשימה מופיע ימין — טיפים ראשונים, אזור אישי אחרון.
import { useEffect } from 'react'
import { Tabs, Redirect, useSegments } from 'expo-router'
import { Platform } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/useAuthStore'
import { isMainTab, useTabHistoryStore } from '@/stores/useTabHistoryStore'

const ACTIVE = '#81ecff'
const INACTIVE = '#adaaaa'
const BAR_BG = 'rgba(32, 32, 31, 0.96)'

export default function TabLayout() {
  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)
  const segments = useSegments()
  const setLastNonProfile = useTabHistoryStore((s) => s.setLastNonProfile)

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
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarHideOnKeyboard: false,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: BAR_BG,
          borderTopWidth: 1,
          borderTopColor: 'rgba(72, 72, 71, 0.15)',
          height: Platform.OS === 'ios' ? 84 : 72,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
        },
        tabBarItemStyle: { paddingVertical: 4 },
      }}
    >
      <Tabs.Screen
        name="tips"
        options={{
          title: 'טיפים',
          tabBarLabel: 'טיפים',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="tips-and-updates" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'מדדים',
          tabBarLabel: 'מדדים',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="leaderboard" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'תיעוד',
          tabBarLabel: 'תיעוד',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="add-circle" size={Math.max(size ?? 24, 28)} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'יומן',
          tabBarLabel: 'יומן',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="menu-book" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'מאמן AI',
          tabBarLabel: 'מאמן',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="smart-toy" size={size ?? 24} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
