import React, { useCallback, useState } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { MaterialIcons } from '@expo/vector-icons'
import { BADGES } from '@gash/constants'
import type { Badge } from '@gash/constants'
import { useBadgesStore } from '@/stores/useBadgesStore'
import { useLogStore } from '@/stores/useLogStore'
import { useStatsStore } from '@/stores/useStatsStore'
import { useHorizontalGutter } from '@/lib/responsiveLayout'
import { getBadgeLiveStatusLine } from '@/lib/badgeProgress'
import { BadgeDetailModal } from '@/components/badges/BadgeDetailModal'

const BADGE_ICON: Record<string, { name: React.ComponentProps<typeof MaterialIcons>['name']; color: string }> = {
  'first-step':         { name: 'rocket-launch',        color: '#00d4ec' },
  'starter':            { name: 'eco',                   color: '#4caf50' },
  'seasoned':           { name: 'local-fire-department', color: '#ff6b35' },
  'legend':             { name: 'emoji-events',          color: '#ffd700' },
  'dominator':          { name: 'workspace-premium',     color: '#81ecff' },
  'three-day-streak':   { name: 'bolt',                  color: '#ffeb3b' },
  'seven-day-streak':   { name: 'star',                  color: '#ffd700' },
  'direct-master':      { name: 'gps-fixed',             color: '#00d4ec' },
  'situational-player': { name: 'explore',               color: '#81ecff' },
  'online-active':      { name: 'phone-android',         color: '#4caf50' },
  'high-spark':         { name: 'auto-awesome',          color: '#ffeb3b' },
  'charmer':            { name: 'mood',                  color: '#ff80ab' },
  'savant':             { name: 'psychology',            color: '#ce93d8' },
}

const COLLAPSED_BADGES_LIMIT = 4

export default function BadgeGallery() {
  const gutter = useHorizontalGutter()
  const [selected, setSelected] = useState<Badge | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const unlockedBadges = useBadgesStore((state) => state.unlockedBadges)
  const checkAndUnlockBadges = useBadgesStore((state) => state.checkAndUnlockBadges)
  const missionsCompleted = useBadgesStore((state) => state.missionsCompleted)
  const approaches = useLogStore((state) => state.approaches)
  const streak = useStatsStore((state) => state.streak)

  const unlockedIds = new Set(unlockedBadges.map((b) => b.id))

  useFocusEffect(
    useCallback(() => {
      checkAndUnlockBadges()
    }, [checkAndUnlockBadges])
  )

  const liveLineFor = useCallback(
    (id: Badge['id']) => getBadgeLiveStatusLine(id, approaches, streak, missionsCompleted),
    [approaches, streak, missionsCompleted]
  )

  const visibleBadges = isExpanded ? BADGES : BADGES.slice(0, COLLAPSED_BADGES_LIMIT)
  const hasHiddenBadges = BADGES.length > COLLAPSED_BADGES_LIMIT

  const renderBadge = ({ item }: { item: (typeof BADGES)[0] }) => {
    const isUnlocked = unlockedIds.has(item.id)
    const unlockedBadge = unlockedBadges.find((b) => b.id === item.id)

    return (
      <Pressable
        style={[styles.badgeContainer, !isUnlocked && styles.badgeContainerLocked]}
        onPress={() => setSelected(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${isUnlocked ? 'הושג' : 'נעול'}. לחץ לפרטים`}
      >
        {!isUnlocked && (
          <MaterialIcons
            name="lock"
            size={14}
            color="#666"
            style={styles.lockIcon}
          />
        )}
        <MaterialIcons
          name={(BADGE_ICON[item.id] ?? { name: 'star', color: '#81ecff' }).name}
          size={36}
          color={isUnlocked ? (BADGE_ICON[item.id]?.color ?? '#81ecff') : '#555'}
          style={{ marginBottom: 10 }}
        />
        <Text style={[styles.badgeTitle, !isUnlocked && styles.badgeTitleLocked]}>{item.title}</Text>
        {isUnlocked && unlockedBadge && (
          <Text style={styles.unlockedDate}>
            {new Date(unlockedBadge.unlockedAt).toLocaleDateString('he-IL')}
          </Text>
        )}
        {!isUnlocked && <Text style={styles.lockedText}>לחץ לפרטים</Text>}
      </Pressable>
    )
  }

  const selectedUnlocked = selected ? unlockedIds.has(selected.id) : false
  const selectedRecord = selected ? unlockedBadges.find((b) => b.id === selected.id) : null
  const unlockedAtLabel =
    selectedRecord != null
      ? new Date(selectedRecord.unlockedAt).toLocaleDateString('he-IL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null

  return (
    <View style={[styles.container, { paddingHorizontal: gutter }]}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>הישגים שלי</Text>
        <Text style={styles.kicker}>תגי התקדמות</Text>
        <Text style={styles.subtitle}>לפי מה שמתועד אצלך. לחיצה על תג לפרטים.</Text>
      </View>
      <FlatList
        data={visibleBadges}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderBadge}
        scrollEnabled={false}
        style={styles.badgeListRtl}
        columnWrapperStyle={styles.columnWrapper}
      />

      {hasHiddenBadges ? (
        <Pressable
          onPress={() => setIsExpanded((value) => !value)}
          style={({ pressed }) => [
            styles.toggleButton,
            pressed && { opacity: 0.88 },
          ]}
        >
          <Text style={styles.toggleText}>
            {isExpanded ? 'הצג פחות' : 'הצג את כל ההישגים'}
          </Text>
        </Pressable>
      ) : null}

      <BadgeDetailModal
        visible={selected != null}
        badge={selected}
        isUnlocked={selectedUnlocked}
        unlockedAtLabel={unlockedAtLabel}
        liveStatusLine={selected ? liveLineFor(selected.id) : ''}
        onClose={() => setSelected(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  /** כמו כותרות ה־hero בטיפים: ltr על המיכל כדי ש־textAlign:right ייושר לימין המסך */
  headerBlock: {
    marginBottom: 18,
    width: '100%',
    alignSelf: 'stretch',
    direction: 'ltr',
  },
  /** גדול — כותרת ראשית */
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
    width: '100%',
  },
  /** בינוני — שורת משנה */
  kicker: {
    fontSize: 15,
    fontWeight: '700',
    color: '#81ecff',
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
    width: '100%',
  },
  /** קטן — תיאור קצר בלבד */
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: '#adaaaa',
    textAlign: 'right',
    writingDirection: 'rtl',
    width: '100%',
  },
  /**
   * שורות התגים: כיוון LTR + row-reverse — התג הראשון ברשימה (אינדקס זוגי)
   * מופיע מימין, הזרימה מימין לשמאל.
   */
  badgeListRtl: {
    direction: 'ltr',
  },
  columnWrapper: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  badgeContainer: {
    flex: 1,
    maxWidth: '48%',
    paddingHorizontal: 10,
    paddingVertical: 14,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#81ecff',
    position: 'relative',
  },
  lockIcon: {
    position: 'absolute',
    top: 10,
    start: 10,
  },
  badgeContainerLocked: {
    borderColor: '#444444',
    opacity: 0.6,
  },
  /** בינוני — שם התג */
  badgeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
    writingDirection: 'rtl',
  },
  badgeTitleLocked: {
    color: '#666666',
  },
  /** קטן — תאריך / נעול */
  unlockedDate: {
    fontSize: 11,
    color: '#81ecff',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  lockedText: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  toggleButton: {
    marginTop: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#20201f',
    borderWidth: 1,
    borderColor: 'rgba(129, 236, 255, 0.28)',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#81ecff',
  },
})
