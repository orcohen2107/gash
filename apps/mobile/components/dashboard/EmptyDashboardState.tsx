import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

export default function EmptyDashboardState() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <MaterialIcons name="insights" size={48} color="#81ecff" />
      </View>
      <Text style={styles.title}>עוד אין מדדים</Text>
      <Text style={styles.subtitle}>
        תיעד את הגישה הראשונה שלך{'\n'}ונתחיל לבנות את התמונה שלך
      </Text>
      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={() => router.push('/(tabs)/log')}
      >
        <MaterialIcons name="add" size={20} color="#003840" />
        <Text style={styles.ctaText}>תיעד גישה ראשונה</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(129, 236, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#adaaaa',
    textAlign: 'center',
    lineHeight: 22,
  },
  cta: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#81ecff',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#003840',
  },
})
