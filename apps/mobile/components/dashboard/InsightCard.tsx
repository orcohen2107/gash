import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'

interface InsightCardProps {
  insight: string
  loading?: boolean
  /** מוצג בשורה „עדכון אחרון“ */
  lastUpdated?: Date | null
}

function formatRelativeHebrew(d: Date): string {
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'לפני רגע'
  if (mins < 60) return `לפני ${mins} דק׳`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `לפני ${hours} שעות`
  const days = Math.floor(hours / 24)
  return `לפני ${days} ימים`
}

export default function InsightCard({ insight, loading, lastUpdated }: InsightCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <MaterialIcons name="auto-awesome" size={24} color="#81ecff" />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.quote}>
          {loading ? 'טוען תובנה…' : `״${insight || 'אין תובנה עדיין'}״`}
        </Text>
        <Text style={styles.meta}>
          עדכון אחרון:{' '}
          {lastUpdated ? formatRelativeHebrew(lastUpdated) : loading ? '…' : 'הרגע'}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 22,
    borderRadius: 12,
    backgroundColor: 'rgba(38, 38, 38, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(129, 236, 255, 0.22)',
    marginBottom: 22,
    shadowColor: '#81ecff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  iconWrap: {
    backgroundColor: 'rgba(129, 236, 255, 0.12)',
    borderRadius: 8,
    padding: 8,
  },
  textCol: {
    flex: 1,
    marginStart: 14,
  },
  quote: {
    fontSize: 15,
    lineHeight: 22,
    color: '#81ecff',
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'right',
  },
  meta: {
    marginTop: 6,
    fontSize: 11,
    color: '#adaaaa',
    textAlign: 'right',
  },
})
