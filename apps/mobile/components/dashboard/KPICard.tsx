import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface KPICardProps {
  label: string
  value: string | number
  icon?: string
}

export default function KPICard({ label, value, icon }: KPICardProps) {
  return (
    <View style={styles.container}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#20201f',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    marginVertical: 8,
    minHeight: 100,
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#adaaaa',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: '#81ecff',
  },
})
