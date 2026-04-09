import React, { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, Text } from 'react-native'
import MissionCard from '@/components/dashboard/MissionCard'
import { useBadgesStore } from '@/stores/useBadgesStore'

export default function DashboardScreen() {
  const mission = useBadgesStore((state) => state.mission)
  const fetchMission = useBadgesStore((state) => state.fetchMission)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadMission = async () => {
      setLoading(true)
      await fetchMission()
      setLoading(false)
    }
    loadMission()
  }, [fetchMission])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>דשבורד</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <MissionCard mission={mission} loading={loading} />
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            נתונים נוספים (מטריקות, גרפים) יופיעו כאן ב-Phase 4
          </Text>
        </View>
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
  placeholder: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 12,
    paddingVertical: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
})
