import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { BarChart } from 'react-native-gifted-charts'
import { useLogStore } from '@/stores/useLogStore'

const APPROACH_TYPES = ['direct', 'situational', 'humor', 'online']
const APPROACH_LABELS: Record<string, string> = {
  direct: 'ישיר',
  situational: 'סיטואטיבי',
  humor: 'הומור',
  online: 'אונליין',
}

export default function SuccessBarChart() {
  const { approaches } = useLogStore()

  const chartData = useMemo(() => {
    return APPROACH_TYPES.map((type) => {
      const typeApproaches = approaches.filter((a) => a.approach_type === type)
      const successCount = typeApproaches.filter(
        (a) => a.response === 'positive' || a.response === 'neutral'
      ).length
      const successRate =
        typeApproaches.length > 0
          ? Math.round((successCount / typeApproaches.length) * 100)
          : 0

      return {
        value: successRate,
        label: APPROACH_LABELS[type],
        labelWidth: 50,
        frontColor:
          successRate > 60 ? '#00d9a3' : successRate > 40 ? '#ffb700' : '#ff6b6b',
      }
    })
  }, [approaches])

  if (approaches.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>אין נתונים לתצוגה</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>שיעור הצלחה לפי סוג</Text>
      <BarChart
        data={chartData}
        barWidth={30}
        barBorderTopLeftRadius={8}
        barBorderTopRightRadius={8}
        height={180}
        width={320}
        yAxisLabelWidth={40}
        backgroundColor="#0e0e0e"
        xAxisLabelTextStyle={{ color: '#adaaaa', fontSize: 10 } as any}
        yAxisTextStyle={{ textAlign: 'center' } as any}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyState: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  emptyText: {
    color: '#adaaaa',
    fontSize: 12,
  },
})
