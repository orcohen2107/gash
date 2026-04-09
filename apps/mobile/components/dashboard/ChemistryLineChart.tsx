import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LineChart } from 'react-native-gifted-charts'
import { useLogStore } from '@/stores/useLogStore'

export default function ChemistryLineChart() {
  const { approaches } = useLogStore()

  const chartData = useMemo(() => {
    const last30 = approaches
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)

    return last30.map((a, idx) => ({
      value: a.chemistry_score ?? 0,
      label: `${idx + 1}`,
      labelWidth: 20,
    }))
  }, [approaches])

  if (chartData.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>אין נתונים לתצוגה</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>טרנד כימיה - 30 הגישות האחרונות</Text>
      <LineChart
        data={chartData}
        height={200}
        width={320}
        yAxisSide={'right' as any}
        yAxisLabelWidth={40}
        color="#81ecff"
        dataPointsColor="#81ecff"
        backgroundColor="#0e0e0e"
        scrollToEnd
        showVerticalLines={false}
        xAxisLabelTextStyle={{ color: '#adaaaa', fontSize: 10 } as any}
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
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  emptyText: {
    color: '#adaaaa',
    fontSize: 12,
  },
})
