import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { APPROACH_TYPE_LABELS, FOLLOW_UP_LABELS } from '@gash/constants'
import type { DashboardSummary } from '@gash/types'

interface LearningSummaryCardProps {
  summary: DashboardSummary
}

export default function LearningSummaryCard({ summary }: LearningSummaryCardProps) {
  const strongestType = summary.strongestType
    ? APPROACH_TYPE_LABELS[summary.strongestType]
    : 'עוד אין מספיק נתונים'
  const practiceType = summary.practiceType
    ? APPROACH_TYPE_LABELS[summary.practiceType]
    : 'תעד עוד גישות'
  const followUp = summary.mostCommonFollowUp
    ? FOLLOW_UP_LABELS[summary.mostCommonFollowUp]
    : 'עוד אין תוצאה נפוצה'

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="insights" size={20} color="#81ecff" />
        <Text style={styles.title}>מה ללמוד מזה</Text>
      </View>

      <View style={styles.rows}>
        <SummaryRow label="הכי חזק אצלך" value={strongestType} />
        <SummaryRow label="כדאי לתרגל" value={practiceType} />
        <SummaryRow label="תוצאה נפוצה" value={followUp} />
        <SummaryRow
          label="כימיה גבוהה"
          value={`${summary.highChemistryCount} גישות (${summary.highChemistryRate}%)`}
        />
      </View>
    </View>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#131313',
    borderWidth: 1,
    borderColor: 'rgba(141, 150, 244, 0.24)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'right',
  },
  rows: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    flexShrink: 0,
    fontSize: 12,
    fontWeight: '700',
    color: '#adaaaa',
    textAlign: 'right',
  },
  value: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'right',
  },
})
