import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  Pressable,
  Animated,
  RefreshControl,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { AppTopBar } from '@/components/layout/AppTopBar'
import { useStatsStore } from '@/stores/useStatsStore'
import { useLogStore } from '@/stores/useLogStore'
import { analytics } from '@/lib/analytics'
import KPICard from '@/components/dashboard/KPICard'
import ChemistryLineChart from '@/components/dashboard/ChemistryLineChart'
import SuccessBarChart from '@/components/dashboard/SuccessBarChart'
import WeeklySummaryCard from '@/components/dashboard/WeeklySummaryCard'
import LearningSummaryCard from '@/components/dashboard/LearningSummaryCard'
import EmptyDashboardState from '@/components/dashboard/EmptyDashboardState'
import StreakNudgeCard from '@/components/dashboard/StreakNudgeCard'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton'
import { APPROACH_TYPE_LABELS, CHEMISTRY_LABELS } from '@gash/constants'
import type { DashboardSummary } from '@gash/types'
import { horizontalGutter } from '@/lib/responsiveLayout'
import {
  injectDashboardDevMock,
  clearDashboardDevMock,
} from '@/lib/dashboardDevMock'
import { loadDashboardBundle } from '@/lib/loadDashboardBundle'

const BG = '#0e0e0e'

export default function DashboardScreen() {
  const { width } = useWindowDimensions()
  const gutter = horizontalGutter(width)
  const tabBarHeight = useBottomTabBarHeight()
  const { totalApproaches, successRate, avgChemistry, topApproachType, streak } = useStatsStore()
  const { approaches } = useLogStore()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [bundleLoading, setBundleLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const STAGGER_MS = 80
  const ANIM_DURATION_MS = 350
  const kpiAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current
  const learningAnim = useRef(new Animated.Value(0)).current

  const runEntranceAnims = useCallback(() => {
    const allAnims = [...kpiAnims, learningAnim]
    allAnims.forEach((anim) => anim.setValue(0))
    const sequences = allAnims.map((anim, i) =>
      Animated.sequence([
        Animated.delay(i * STAGGER_MS),
        Animated.timing(anim, {
          toValue: 1,
          duration: ANIM_DURATION_MS,
          useNativeDriver: true,
        }),
      ])
    )
    Animated.parallel(sequences).start()
  }, [kpiAnims, learningAnim])

  const cardWidth = (width - 2 * gutter - 16) / 2

  useFocusEffect(
    useCallback(() => {
      analytics.trackScreenView('dashboard')
      analytics.trackInsightsViewed(approaches.length)
    }, [approaches.length])
  )

  useEffect(() => {
    const unsubscribe = useLogStore.getState().subscribeToChanges()
    void (async () => {
      try {
        const data = await loadDashboardBundle()
        setSummary(data.summary)
      } catch (err) {
        console.error('Failed to load dashboard bundle:', err)
      } finally {
        setBundleLoading(false)
        runEntranceAnims()
      }
    })()
    return unsubscribe
  }, [runEntranceAnims])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const data = await loadDashboardBundle()
      setSummary(data.summary)
      useStatsStore.getState().computeStats()
    } catch (err) {
      console.error('Failed to refresh dashboard:', err)
    } finally {
      setIsRefreshing(false)
      runEntranceAnims()
    }
  }, [runEntranceAnims])

  const chemRounded = Math.min(10, Math.max(1, Math.round(Number(avgChemistry) || 0)))
  const chemistryWord =
    totalApproaches > 0 && avgChemistry > 0 ? (CHEMISTRY_LABELS[chemRounded] ?? '') : ''

  if (bundleLoading) {
    return (
      <View style={styles.safe}>
        <AppTopBar from="dashboard" />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: gutter, paddingBottom: tabBarHeight + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        >
          <DashboardSkeleton />
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={styles.safe}>
      <AppTopBar from="dashboard" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: gutter,
            paddingBottom: tabBarHeight + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#81ecff"
          />
        }
      >
        {summary ? <WeeklySummaryCard summary={summary} /> : null}

        {totalApproaches === 0 ? (
          <EmptyDashboardState />
        ) : (
          <>
            <StreakNudgeCard streak={streak} totalApproaches={totalApproaches} />

            <View style={styles.kpiGrid}>
              <Animated.View
                style={{
                  width: cardWidth,
                  opacity: kpiAnims[0],
                  transform: [{ translateY: kpiAnims[0].interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
                }}
              >
                <KPICard
                  label='סה״כ גישות'
                  value={totalApproaches}
                  icon="person-add"
                  accent="primary"
                />
              </Animated.View>
              <Animated.View
                style={{
                  width: cardWidth,
                  opacity: kpiAnims[1],
                  transform: [{ translateY: kpiAnims[1].interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
                }}
              >
                <KPICard
                  label="שיעור הצלחה"
                  value={`${successRate}%`}
                  icon="trending-up"
                  accent="tertiary"
                />
              </Animated.View>
              <Animated.View
                style={{
                  width: cardWidth,
                  opacity: kpiAnims[2],
                  transform: [{ translateY: kpiAnims[2].interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
                }}
              >
                <KPICard
                  label="כימיה ממוצעת"
                  value={avgChemistry.toFixed(1)}
                  icon="favorite"
                  accent="secondary"
                  subLabel={chemistryWord}
                />
              </Animated.View>
              <Animated.View
                style={{
                  width: cardWidth,
                  opacity: kpiAnims[3],
                  transform: [{ translateY: kpiAnims[3].interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
                }}
              >
                <KPICard
                  label="סוג הכי מצליח"
                  value={topApproachType ? APPROACH_TYPE_LABELS[topApproachType] : '—'}
                  icon="bolt"
                  accent="primaryGlow"
                  trailingIcon={topApproachType ? 'verified' : undefined}
                />
              </Animated.View>
            </View>

            {summary ? (
              <Animated.View
                style={{
                  opacity: learningAnim,
                  transform: [{ translateY: learningAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
                }}
              >
                <LearningSummaryCard summary={summary} />
              </Animated.View>
            ) : null}

            <SuccessBarChart />
            <ChemistryLineChart />
          </>
        )}

        {__DEV__ ? (
          <View style={styles.devMock}>
            <Text style={styles.devMockTitle}>מצב פיתוח — תצוגת מדדים</Text>
            <Pressable
              style={({ pressed }) => [styles.devBtn, pressed && styles.devBtnPressed]}
              onPress={() => injectDashboardDevMock()}
            >
              <Text style={styles.devBtnText}>טען נתוני דמה (מקומי)</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.devBtnOutline, pressed && styles.devBtnPressed]}
              onPress={() => {
                void (async () => {
                  try {
                    const data = await clearDashboardDevMock()
                    setSummary(data.summary)
                  } catch (e) {
                    console.error(e)
                  }
                })()
              }}
            >
              <Text style={styles.devBtnTextOutline}>החזר גישות מהשרת</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    marginBottom: 16,
  },
  devMock: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(129, 236, 255, 0.35)',
    backgroundColor: 'rgba(38, 38, 38, 0.5)',
    gap: 10,
  },
  devMockTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#81ecff',
    textAlign: 'center',
    marginBottom: 4,
  },
  devBtn: {
    backgroundColor: '#81ecff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  devBtnOutline: {
    borderWidth: 1,
    borderColor: '#81ecff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  devBtnPressed: {
    opacity: 0.85,
  },
  devBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#003840',
  },
  devBtnTextOutline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#81ecff',
  },
})
