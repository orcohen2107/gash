import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { Tip } from '@gash/constants'

interface TipCardProps {
  tip: Tip
}

export default function TipCard({ tip }: TipCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{tip.emoji}</Text>
        <Text style={styles.title}>{tip.title}</Text>
      </View>
      <Text style={styles.description}>{tip.description}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#81ecff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 20,
    marginEnd: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    textAlign: 'right',
  },
  description: {
    fontSize: 14,
    color: '#adaaaa',
    lineHeight: 20,
    textAlign: 'right',
  },
})
