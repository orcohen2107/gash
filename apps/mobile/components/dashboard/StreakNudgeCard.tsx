import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'

interface StreakNudgeCardProps {
  streak: number
}

interface NudgeConfig {
  message: string
  icon: React.ComponentProps<typeof MaterialIcons>['name']
  color: string
}

function resolveNudgeConfig(streak: number): NudgeConfig {
  if (streak === 0) {
    return { message: 'תיעד גישה היום כדי להתחיל רצף', icon: 'flag', color: '#adaaaa' }
  }
  if (streak < 7) {
    return {
      message: `עוד ${7 - streak} ימים לרצף שבועי`,
      icon: 'local-fire-department',
      color: '#ff9f43',
    }
  }
  if (streak < 30) {
    return { message: `רצף של ${streak} ימים — אלוף!`, icon: 'emoji-events', color: '#ffd32a' }
  }
  return { message: `${streak} ימים ברצף — מכונה!`, icon: 'bolt', color: '#81ecff' }
}

export default function StreakNudgeCard({ streak }: StreakNudgeCardProps) {
  const { message, icon, color } = resolveNudgeConfig(streak)

  return (
    <View style={[styles.container, { borderStartColor: color }]}>
      <Text style={styles.message}>{message}</Text>
      <MaterialIcons name={icon} size={22} color={color} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#131313',
    borderStartWidth: 4,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'right',
    marginEnd: 10,
  },
})
