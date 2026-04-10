import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { Mission } from '@/stores/useBadgesStore'
import { APPROACH_TYPE_LABELS } from '@gash/constants'

interface MissionCardProps {
  mission: Mission | null
  loading?: boolean
}

export default function MissionCard({ mission, loading = false }: MissionCardProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🎯 משימה השבוע</Text>
        <Text style={styles.loading}>טוען...</Text>
      </View>
    )
  }

  if (!mission) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🎯 משימה השבוע</Text>
        <Text style={styles.description}>התחל לתעד גישות כדי לקבל משימה מותאמת</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 משימה השבוע</Text>
      <Text style={styles.missionTitle}>{mission.title}</Text>
      <Text style={styles.description}>{mission.description}</Text>
      <View style={styles.targetContainer}>
        <Text style={styles.targetLabel}>
          {mission.target} × {APPROACH_TYPE_LABELS[mission.target_approach_type]}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderStartWidth: 4,
    borderStartColor: '#81ecff',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'right',
    marginBottom: 8,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#81ecff',
    textAlign: 'right',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#adaaaa',
    lineHeight: 20,
    textAlign: 'right',
    marginBottom: 12,
  },
  targetContainer: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#0e0e0e',
    borderRadius: 4,
  },
  targetLabel: {
    fontSize: 13,
    color: '#81ecff',
    textAlign: 'right',
    fontWeight: '500',
  },
  loading: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
})
