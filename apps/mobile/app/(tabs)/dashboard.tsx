import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import MissionCard from '@/components/dashboard/MissionCard'
import { AppTopBar } from '@/components/layout/AppTopBar'
import { useBadgesStore } from '@/stores/useBadgesStore'
import { useStatsStore } from '@/stores/useStatsStore'
import { useLogStore } from '@/stores/useLogStore'
import { analytics } from '@/lib/analytics'
import KPICard from '@/components/dashboard/KPICard'
import InsightCard from '@/components/dashboard/InsightCard'
import ChemistryLineChart from '@/components/dashboard/ChemistryLineChart'
import SuccessBarChart from '@/components/dashboard/SuccessBarChart'
import { APPROACH_TYPE_LABELS, CHEMISTRY_LABELS } from '@gash/constants'
import { horizontalGutter } from '@/lib/responsiveLayout'
import {
  injectDashboardDevMock,
  clearDashboardDevMock,
} from '@/lib/dashboardDevMock'
import { loadDashboardBundle } from '@/lib/loadDashboardBundle'

const BG = '#0e0e0e'
const INSIGHT_FALLBACK = 'המשך לתעד גישות כדי לקבל תובנות מ-AI'

export default function DashboardScreen() {
  const { width } = useWindowDimensions()
  const gutter = horizontalGutter(width)
  const tabBarHeight = useBottomTabBarHeight()
  const mission = useBadgesStore((state) => state.mission)
  const isLoadingMission = useBadgesStore((state) => state.isLoadingMission)
  const { totalApproaches, successRate, avgChemistry, topApproachType } = useStatsStore()
  const { approaches } = useLogStore()
  const [insight, setInsight] = useState<string>('')
  const [insightUpdatedAt, setInsightUpdatedAt] = useState<Date | null>(null)
  const [bundleLoading, setBundleLoading] = useState(true)

  const cardWidth = (width - 2 * gutter - 16) / 2

  useFocusEffect(
    useCallback(() => {
      analytics.trackScreenView('dashboard')
      analytics.trackInsightsViewed(approaches.length)
    }, [approaches.length])
  )

  useEffect(() => {
    useBadgesStore.setState({ isLoadingMission: true })
    const unsubscribe = useLogStore.getState().subscribeToChanges()
    void (async () => {
      try {
        const data = await loadDashboardBundle()
        setInsight(data.insights.insights[0] ?? INSIGHT_FALLBACK)
        setInsightUpdatedAt(new Date())
      } catch (err) {
        console.error('Failed to load dashboard bundle:', err)
        useBadgesStore.setState({ isLoadingMission: false })
        setInsight(INSIGHT_FALLBACK)
        setInsightUpdatedAt(new Date())
      } finally {
        setBundleLoading(false)
      }
    })()
    return unsubscribe
  }, [])

  const chemRounded = Math.min(10, Math.max(1, Math.round(Number(avgChemistry) || 0)))
  const chemistryWord = CHEMISTRY_LABELS[chemRounded] ?? ''

  if (bundleLoading) {
    return (
      <View style={styles.safe}>
        <AppTopBar from="dashboard" />
        <View style={[styles.loadingBody, { paddingBottom: tabBarHeight + 32 }]}>
          <ActivityIndicator size="large" color="#81ecff" />
        </View>
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
      >
        <InsightCard insight={insight} loading={false} lastUpdated={insightUpdatedAt} />

        <View style={styles.kpiGrid}>
          <View style={{ width: cardWidth }}>
            <KPICard
              label='סה״כ גישות'
              value={totalApproaches}
              icon="person-add"
              accent="primary"
            />
          </View>
          <View style={{ width: cardWidth }}>
            <KPICard
              label="שיעור הצלחה"
              value={`${successRate}%`}
              icon="trending-up"
              accent="tertiary"
            />
          </View>
          <View style={{ width: cardWidth }}>
            <KPICard
              label="כימיה ממוצעת"
              value={avgChemistry.toFixed(1)}
              icon="favorite"
              accent="secondary"
              subLabel={chemistryWord}
            />
          </View>
          <View style={{ width: cardWidth }}>
            <KPICard
              label="סוג הכי מצליח"
              value={topApproachType ? APPROACH_TYPE_LABELS[topApproachType] : '—'}
              icon="bolt"
              accent="primaryGlow"
              trailingIcon={topApproachType ? 'verified' : undefined}
            />
          </View>
        </View>

        <ChemistryLineChart />
        <SuccessBarChart />

        <MissionCard mission={mission} loading={isLoadingMission} />

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
                    setInsight(data.insights.insights[0] ?? INSIGHT_FALLBACK)
                    setInsightUpdatedAt(new Date())
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
    marginBottom: 8,
  },
  loadingBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
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
