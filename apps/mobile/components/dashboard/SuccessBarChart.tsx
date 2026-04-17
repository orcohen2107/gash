import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import { useLogStore } from '@/stores/useLogStore'
import { APPROACH_TYPE_LABELS } from '@gash/constants'
import type { ApproachType } from '@gash/types'

const ORDER: ApproachType[] = ['direct', 'situational', 'humor', 'online']

export default function SuccessBarChart() {
  const { approaches } = useLogStore()

  const rows = useMemo(() => {
    return ORDER.map((type) => {
      const typeApproaches = approaches.filter((a) => a.approach_type === type)
      const successCount = typeApproaches.filter(
        (a) => a.response === 'positive' || a.response === 'neutral'
      ).length
      const successRate =
        typeApproaches.length > 0
          ? Math.round((successCount / typeApproaches.length) * 100)
          : 0
      return {
        type,
        label: APPROACH_TYPE_LABELS[type],
        pct: successRate,
      }
    })
  }, [approaches])

  if (approaches.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.heading}>הצלחה לפי סוג גישה</Text>
        <View style={styles.emptyState}>
          <MaterialIcons name="bar-chart" size={32} color="#3a3a3a" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>תיעד גישות כדי לראות את שיעורי ההצלחה שלך</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>הצלחה לפי סוג גישה</Text>
      <View style={styles.list}>
        {rows.map((row, index) => (
          <BarRow key={row.type} row={row} rowIndex={index} />
        ))}
      </View>
    </View>
  )
}

function BarRow({ row, rowIndex }: { row: { label: string; pct: number }; rowIndex: number }) {
  const pct = Math.min(100, Math.max(0, row.pct))
  /** מיקום בשורה (0–3) קובע צבע כמו במוקאפ: ישיר גרדיאנט, אחרים צבעים קבועים */
  const variant = rowIndex % 4
  const useGradient = variant === 0

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text
          style={[
            styles.pct,
            variant === 0 && styles.pctPrimary,
            variant === 1 && styles.pctTertiary,
            variant === 2 && styles.pctTertiary,
            variant === 3 && styles.pctMuted,
          ]}
        >
          {row.pct}%
        </Text>
        <Text style={styles.label}>{row.label}</Text>
      </View>
      <View style={styles.track}>
        {useGradient ? (
          <LinearGradient
            colors={['#81ecff', '#00d4ec']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.fill, { width: `${pct}%` }]}
          />
        ) : (
          <View
            style={[
              styles.fillSolid,
              { width: `${pct}%` },
              variant === 1 && { backgroundColor: '#a2aaff' },
              variant === 2 && { backgroundColor: '#a2aaff' },
              variant === 3 && { backgroundColor: '#767575' },
            ]}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 8,
  },
  heading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'right',
    marginBottom: 16,
  },
  list: {
    marginBottom: 4,
  },
  row: {
    marginBottom: 16,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'right',
  },
  pct: {
    fontSize: 12,
    fontWeight: '700',
  },
  pctPrimary: {
    color: '#81ecff',
  },
  pctTertiary: {
    color: '#a2aaff',
  },
  pctMuted: {
    color: '#767575',
  },
  track: {
    height: 12,
    borderRadius: 999,
    backgroundColor: '#262626',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  fillSolid: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#00d4ec',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
    backgroundColor: '#131313',
    borderRadius: 12,
    gap: 8,
  },
  emptyIcon: {
    marginBottom: 4,
  },
  emptyText: {
    color: '#adaaaa',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
})
