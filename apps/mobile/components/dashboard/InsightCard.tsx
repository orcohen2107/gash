import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface InsightCardProps {
  insight: string
  loading?: boolean
}

export default function InsightCard({ insight, loading }: InsightCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>תובנה מ-AI</Text>
      <Text style={styles.text}>
        {loading ? 'טוען...' : insight || 'אין תובנות עדיין'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#20201f',
    borderLeftWidth: 4,
    borderLeftColor: '#81ecff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#81ecff',
    textAlign: 'right',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'right',
    lineHeight: 20,
  },
})
