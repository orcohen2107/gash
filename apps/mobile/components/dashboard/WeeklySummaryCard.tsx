import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import type { DashboardSummary } from '@gash/types'

interface WeeklySummaryCardProps {
  summary: DashboardSummary
}

function weeklyDeltaText(delta: number): string {
  if (delta > 0) return `+${delta} מול שבוע שעבר`
  if (delta < 0) return `${Math.abs(delta)} פחות משבוע שעבר`
  return 'כמו שבוע שעבר'
}

export default function WeeklySummaryCard({ summary }: WeeklySummaryCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="calendar-today" size={20} color="#81ecff" />
        <Text style={styles.title}>השבוע שלך</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.value}>{summary.thisWeekApproaches}</Text>
          <Text style={styles.label}>גישות השבוע</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.value}>{summary.currentStreak}</Text>
          <Text style={styles.label}>רצף ימים</Text>
        </View>
      </View>

      <Text style={styles.note}>{weeklyDeltaText(summary.weeklyDelta)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(129, 236, 255, 0.22)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  stat: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#20201f',
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: '#81ecff',
    textAlign: 'right',
  },
  label: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: '#adaaaa',
    textAlign: 'right',
  },
  note: {
    marginTop: 12,
    fontSize: 13,
    color: '#d5d5d5',
    textAlign: 'right',
  },
})
