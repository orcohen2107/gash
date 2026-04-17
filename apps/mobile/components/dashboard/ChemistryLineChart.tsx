import React, { useMemo } from 'react'
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native'
import { LineChart } from 'react-native-gifted-charts'
import { useLogStore } from '@/stores/useLogStore'

function formatDayMonth(iso: string): string {
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}`
}

const MIN_POINTS = 2

export default function ChemistryLineChart() {
  const { width: screenW } = useWindowDimensions()
  const { approaches } = useLogStore()

  const chartWidth = Math.min(screenW - 48, 400)

  const chartData = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    cutoff.setHours(0, 0, 0, 0)

    return approaches
      .filter((a) => new Date(a.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((a) => ({
        value: a.chemistry_score ?? 0,
        label: formatDayMonth(a.date),
      }))
  }, [approaches])

  const xLabels = useMemo(() => {
    if (chartData.length === 0) return []
    const pick = (i: number) => chartData[Math.min(i, chartData.length - 1)]?.label ?? ''
    if (chartData.length <= 4) return chartData.map((d) => d.label)
    return [
      pick(0),
      pick(Math.floor(chartData.length / 3)),
      pick(Math.floor((chartData.length * 2) / 3)),
      pick(chartData.length - 1),
    ]
  }, [chartData])

  const pointSpacing =
    chartData.length <= 1
      ? 40
      : (chartWidth - 48) / Math.max(chartData.length - 1, 1)

  if (chartData.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.titleRow}>
          <Text style={styles.badge}>30 ימים אחרונים</Text>
          <Text style={styles.title}>כימיה לאורך זמן</Text>
        </View>
        <View style={[styles.chartShell, { height: 180 }]}>
          <Text style={styles.emptyText}>אין גישות ב־30 הימים האחרונים</Text>
        </View>
      </View>
    )
  }

  if (chartData.length < MIN_POINTS) {
    return (
      <View style={styles.section}>
        <View style={styles.titleRow}>
          <Text style={styles.badge}>30 ימים אחרונים</Text>
          <Text style={styles.title}>כימיה לאורך זמן</Text>
        </View>
        <View style={[styles.chartShell, { height: 180 }]}>
          <Text style={styles.emptyText}>עוד {MIN_POINTS - chartData.length} גישות לגרף הכימיה</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text style={styles.badge}>30 ימים אחרונים</Text>
        <Text style={styles.title}>כימיה לאורך זמן</Text>
      </View>
      <View style={styles.chartShell}>
        <LineChart
          data={chartData}
          height={176}
          width={chartWidth}
          yAxisSide={'right' as any}
          yAxisLabelWidth={36}
          maxValue={10}
          noOfSections={4}
          yAxisTextStyle={styles.axisText}
          color="#81ecff"
          thickness={3}
          dataPointsColor="#81ecff"
          dataPointsRadius={3}
          backgroundColor="transparent"
          scrollToEnd
          hideRules
          xAxisThickness={0}
          yAxisThickness={0}
          xAxisLabelsHeight={0}
          spacing={pointSpacing}
          initialSpacing={12}
          endSpacing={12}
        />
        <View style={styles.xAxisRow}>
          {xLabels.map((label, i) => (
            <Text key={`${label}-${i}`} style={styles.xLabel}>
              {label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'right',
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#adaaaa',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chartShell: {
    backgroundColor: '#20201f',
    borderRadius: 12,
    paddingTop: 12,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  axisText: {
    color: '#767575',
    fontSize: 9,
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  xLabel: {
    fontSize: 9,
    color: '#767575',
  },
  emptyText: {
    color: '#adaaaa',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 32,
  },
})
