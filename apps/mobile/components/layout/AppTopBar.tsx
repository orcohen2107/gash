import React, { useCallback } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { UserAvatarEditor } from '@/components/profile/UserAvatarEditor'
import { fetchAndSyncUserProfile } from '@/lib/userProfileSync'

const BG = '#0e0e0e'
const ACCENT = '#81ecff'

export type AppTopBarFrom = 'tips' | 'dashboard' | 'log' | 'journal'

/** כותרת מרכזית: רק בטיפים מוצג שם המותג; בשאר המסכים — כותרת עברית. */
const CENTER_TITLE: Record<AppTopBarFrom, string> = {
  tips: 'Gash',
  dashboard: 'המדדים שלי',
  log: 'התיעוד שלי',
  journal: 'יומן שלי',
}

interface AppTopBarProps {
  from: AppTopBarFrom
}

/** סרגל עליון אחיד: הגדרות | כותרת | תמונת פרופיל / אות ראשונה */
export function AppTopBar({ from }: AppTopBarProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  useFocusEffect(
    useCallback(() => {
      void fetchAndSyncUserProfile()
    }, [])
  )

  return (
    <View style={[styles.wrap, { paddingTop: insets.top, backgroundColor: BG }]}>
      <View style={styles.row}>
        <View style={styles.side}>
          <Pressable
            onPress={() => router.push(`/profile?from=${from}`)}
            style={styles.iconBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="הגדרות"
          >
            <MaterialIcons name="settings" size={24} color={ACCENT} />
          </Pressable>
        </View>
        <Text
          style={from === 'tips' ? styles.brand : styles.screenTitle}
          numberOfLines={1}
        >
          {CENTER_TITLE[from]}
        </Text>
        <View style={[styles.side, styles.sideEnd]}>
          <UserAvatarEditor
            size={36}
            style={{
              borderWidth: 1,
              borderColor: 'rgba(72, 72, 71, 0.35)',
            }}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 56,
  },
  side: {
    flex: 1,
    alignItems: 'flex-start',
  },
  sideEnd: {
    alignItems: 'flex-end',
  },
  brand: {
    flexShrink: 1,
    fontSize: 22,
    fontWeight: '800',
    color: ACCENT,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  screenTitle: {
    flexShrink: 1,
    fontSize: 20,
    fontWeight: '800',
    color: ACCENT,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  iconBtn: {
    padding: 4,
  },
})
