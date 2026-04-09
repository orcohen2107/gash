import React, { useEffect, useState, useCallback } from 'react'
import { View, ScrollView, StyleSheet, Text } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import MissionCard from '@/components/dashboard/MissionCard'
import { useBadgesStore } from '@/stores/useBadgesStore'
import { useStatsStore } from '@/stores/useStatsStore'
import { useLogStore } from '@/stores/useLogStore'
import { analytics } from '@/lib/analytics'
import KPICard from '@/components/dashboard/KPICard'
import InsightCard from '@/components/dashboard/InsightCard'
import ChemistryLineChart from '@/components/dashboard/ChemistryLineChart'
import SuccessBarChart from '@/components/dashboard/SuccessBarChart'

const APPROACH_TYPE_LABELS: Record<string, string> = {
  direct: 'ישיר',
  situational: 'סיטואטיבי',
  humor: 'הומור',
  online: 'אונליין',
}

export default function DashboardScreen() {
  const mission = useBadgesStore((state) => state.mission)
  const isLoadingMission = useBadgesStore((state) => state.isLoadingMission)
  const fetchMission = useBadgesStore((state) => state.fetchMission)
  const { totalApproaches, successRate, avgChemistry, topApproachType, isLoadingInsights, fetchInsights } = useStatsStore()
  const { approaches } = useLogStore()
  const [insight, setInsight] = useState<string>('')

  // Track screen view
  useFocusEffect(
    useCallback(() => {
      analytics.trackScreenView('dashboard')
      // Track insights viewed when dashboard is shown
      analytics.trackInsightsViewed(approaches.length)
    }, [approaches.length])
  )

  // Load mission and insight on mount and subscribe to changes
  useEffect(() => {
    fetchMission()
    loadInsight()
    const unsubscribe = useLogStore.getState().subscribeToChanges()
    return unsubscribe
  }, [fetchMission])

  const loadInsight = async () => {
    try {
      const insightsData = await fetchInsights()
      const firstInsight = insightsData.insights?.[0] || 'המשך לתעד גישות כדי לקבל תובנות מ-AI'
      setInsight(firstInsight)
    } catch (err) {
      console.error('Failed to load insight:', err)
      setInsight('המשך לתעד גישות כדי לקבל תובנות מ-AI')
    }
  }

  if (approaches.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>דשבורד</Text>
        <Text style={styles.emptyText}>
          התחל לתעד גישות כדי לראות ניתוחים ותובנות
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>דשבורד</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Mission Card */}
        <MissionCard mission={mission} loading={isLoadingMission} />

        {/* KPI Cards Grid */}
        <View style={styles.kpiGrid}>
          <KPICard label="סה״כ גישות" value={totalApproaches} icon="📊" />
          <KPICard label="שיעור הצלחה" value={`${successRate}%`} icon="✅" />
          <KPICard label="ממוצע כימיה" value={avgChemistry} icon="⚡" />
          <KPICard
            label="סוג מוביל"
            value={topApproachType ? APPROACH_TYPE_LABELS[topApproachType] : '—'}
            icon="🎯"
          />
        </View>

        {/* Charts */}
        <ChemistryLineChart />
        <SuccessBarChart />

        {/* Insight Card */}
        <InsightCard insight={insight} loading={isLoadingInsights} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#0e0e0e',
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 14,
    color: '#adaaaa',
    textAlign: 'center',
    lineHeight: 20,
  },
})
