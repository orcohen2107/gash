import React, { useMemo } from 'react'
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { UserAvatarEditor } from '@/components/profile/UserAvatarEditor'
import { horizontalGutter, topBarTitleSize } from '@/lib/responsiveLayout'

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
  const { width } = useWindowDimensions()
  const gutter = horizontalGutter(width)
  const brandSize = topBarTitleSize(width, true)
  const titleSize = topBarTitleSize(width, false)
  const avatarSize = width < 360 ? 32 : 36

  const titleStyle = useMemo(
    () =>
      from === 'tips'
        ? [styles.brand, { fontSize: brandSize }]
        : [styles.screenTitle, { fontSize: titleSize }],
    [from, brandSize, titleSize]
  )

  return (
    <View style={[styles.wrap, { paddingTop: insets.top, backgroundColor: BG }]}>
      <View style={[styles.row, { paddingHorizontal: gutter }]}>
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
        <Text style={titleStyle} numberOfLines={1}>
          {CENTER_TITLE[from]}
        </Text>
        <View style={[styles.side, styles.sideEnd]}>
          <UserAvatarEditor
            size={avatarSize}
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
    fontWeight: '800',
    color: ACCENT,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  screenTitle: {
    flexShrink: 1,
    fontWeight: '800',
    color: ACCENT,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  iconBtn: {
    padding: 4,
  },
})
