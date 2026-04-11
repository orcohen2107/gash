import React, { useMemo, useState, useEffect, useCallback } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import { TIPS } from '@gash/constants'
import type { Tip } from '@gash/constants'
import TipCard from '@/components/tips/TipCard'
import CategoryFilter, { type TipsFilterValue } from '@/components/tips/CategoryFilter'
import SearchInput from '@/components/tips/SearchInput'
import BadgeGallery from '@/components/badges/BadgeGallery'
import { useBadgesStore } from '@/stores/useBadgesStore'
import { useStatsStore } from '@/stores/useStatsStore'
import { useLogStore } from '@/stores/useLogStore'
import { analytics } from '@/lib/analytics'
import { AppTopBar } from '@/components/layout/AppTopBar'
import { horizontalGutter } from '@/lib/responsiveLayout'

const BG = '#0e0e0e'
const ACCENT = '#81ecff'
const ACCENT_END = '#00d4ec'
const ON_GRAD = '#003840'
const MUTED = '#adaaaa'

function categoryDisplayLabel(category: Tip['category']): string {
  switch (category) {
    case 'אישור':
      return 'שיחה'
    case 'זיהוי':
      return 'גישה'
    case 'ביטחון':
      return 'ביטחון'
    case 'ליווי':
      return 'ליווי'
    default:
      return category
  }
}

function readMinutesFor(tip: Tip): number {
  return Math.max(1, Math.ceil((tip.title.length + tip.description.length) / 280))
}

export default function TipsScreen() {
  const { width } = useWindowDimensions()
  const gutter = horizontalGutter(width)
  const tabBarHeight = useBottomTabBarHeight()
  const heroTitleSize = width < 360 ? 20 : 24
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TipsFilterValue>('all')
  const [completing, setCompleting] = useState(false)

  const streak = useStatsStore((s) => s.streak)
  const checkAndUnlockBadges = useBadgesStore((state) => state.checkAndUnlockBadges)
  const mission = useBadgesStore((s) => s.mission)
  const isLoadingMission = useBadgesStore((s) => s.isLoadingMission)
  const fetchMission = useBadgesStore((s) => s.fetchMission)
  const completeMission = useBadgesStore((s) => s.completeMission)
  const approaches = useLogStore((s) => s.approaches)

  useFocusEffect(
    useCallback(() => {
      analytics.trackScreenView('tips')
      void fetchMission()
    }, [fetchMission])
  )

  useEffect(() => {
    checkAndUnlockBadges()
  }, [checkAndUnlockBadges])

  const missionProgress = useMemo(() => {
    if (!mission) return { raw: 0, display: 0, target: 0, pct: 0 }
    const raw = approaches.filter((a) => a.approach_type === mission.target_approach_type).length
    const display = Math.min(raw, mission.target)
    const pct =
      mission.target > 0 ? Math.min(100, Math.round((raw / mission.target) * 100)) : 0
    return { raw, display, target: mission.target, pct }
  }, [mission, approaches])

  const filteredTips = useMemo(() => {
    return TIPS.filter((tip) => {
      if (selectedCategory !== 'all' && tip.category !== selectedCategory) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          tip.title.toLowerCase().includes(q) || tip.description.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [searchQuery, selectedCategory])

  const onCompleteMission = async () => {
    if (!mission || missionProgress.raw < mission.target) return
    setCompleting(true)
    try {
      await completeMission()
      await fetchMission()
    } finally {
      setCompleting(false)
    }
  }

  return (
    <View style={styles.container}>
      <AppTopBar from="tips" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroRow, { paddingHorizontal: gutter }]}>
          <View style={styles.streakPill}>
            <Text style={styles.streakText}>🔥 רצף: {streak} ימים</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={[styles.heroTitle, { fontSize: heroTitleSize }]}>טיפים ותפקידים</Text>
            <Text style={styles.heroSub}>התקדמות אישית וכלים להצלחה</Text>
          </View>
        </View>

        {/* משימה שבועית */}
        <View style={[styles.missionWrap, { marginHorizontal: gutter }]}>
          <View style={styles.missionGlow} />
          <View style={styles.missionHeader}>
            <Text style={styles.missionKicker}>המשימה השבועית</Text>
            <MaterialIcons name="rocket-launch" size={22} color="#00d4ec" />
          </View>
          {isLoadingMission ? (
            <ActivityIndicator color={ACCENT} style={{ marginVertical: 16 }} />
          ) : mission ? (
            <>
              <Text style={styles.missionTitle}>{mission.title}</Text>
              <View style={styles.progressBlock}>
                <View style={styles.progressLabels}>
                  <Text style={styles.mutedSmall}>התקדמות</Text>
                  <Text style={styles.progressFrac}>
                    {missionProgress.display} מתוך {mission.target}
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={[ACCENT, ACCENT_END]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.progressFill, { width: `${missionProgress.pct}%` }]}
                  />
                </View>
              </View>
              <Pressable
                onPress={onCompleteMission}
                disabled={completing || missionProgress.raw < mission.target}
                style={({ pressed }) => [
                  styles.completeBtn,
                  (missionProgress.raw < mission.target || completing) && styles.completeBtnDisabled,
                  pressed && missionProgress.raw >= mission.target && !completing && { opacity: 0.92 },
                ]}
              >
                <LinearGradient
                  colors={
                    missionProgress.raw >= mission.target && !completing
                      ? [ACCENT, ACCENT_END]
                      : ['#3a3a3a', '#2a2a2a']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.completeGradient}
                >
                  {completing ? (
                    <ActivityIndicator color={ON_GRAD} />
                  ) : (
                    <Text
                      style={[
                        styles.completeLabel,
                        missionProgress.raw < mission.target && styles.completeLabelMuted,
                      ]}
                    >
                      סמן כבוצע
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </>
          ) : (
            <Text style={styles.missionFallback}>התחל לתעד גישות כדי לקבל משימה שבועית</Text>
          )}
        </View>

        <SearchInput value={searchQuery} onChangeText={setSearchQuery} />

        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <View style={styles.listGap}>
          {filteredTips.length > 0 ? (
            filteredTips.map((tip, index) => (
              <TipCard
                key={tip.id}
                tip={tip}
                variant={index === 0 ? 'featured' : 'default'}
                categoryLabel={categoryDisplayLabel(tip.category)}
                readMinutes={readMinutesFor(tip)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>לא נמצאו טיפים</Text>
            </View>
          )}
        </View>

        <BadgeGallery />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  /** direction ltr: רצף משמאל, כותרות «טיפים ותפקידים» מימין */
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 12,
    direction: 'ltr',
  },
  heroText: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-end',
  },
  heroTitle: {
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'right',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'right',
  },
  streakPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#20201f',
    borderWidth: 1,
    borderColor: 'rgba(72, 72, 71, 0.2)',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
    color: ACCENT,
  },
  missionWrap: {
    marginBottom: 28,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#131313',
    overflow: 'hidden',
  },
  missionGlow: {
    position: 'absolute',
    top: -40,
    start: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(129, 236, 255, 0.06)',
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  missionKicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#00d4ec',
    backgroundColor: 'rgba(129, 236, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  missionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'right',
    marginBottom: 16,
  },
  progressBlock: {
    marginBottom: 20,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mutedSmall: {
    fontSize: 12,
    fontWeight: '500',
    color: MUTED,
  },
  progressFrac: {
    fontSize: 12,
    fontWeight: '700',
    color: ACCENT,
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: '#262626',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  completeBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  completeBtnDisabled: {
    opacity: 0.85,
  },
  completeGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: ON_GRAD,
  },
  completeLabelMuted: {
    color: '#adaaaa',
  },
  missionFallback: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'right',
    lineHeight: 20,
  },
  listGap: {
    marginTop: 8,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: MUTED,
  },
})
