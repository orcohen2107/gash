import { useEffect, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { LogBottomSheet } from '@/components/log/LogBottomSheet'
import { useLogStore } from '@/stores/useLogStore'
import { analytics } from '@/lib/analytics'

/**
 * טאב תיעוד: נפתח ישירות על טופס התיעוד (בלי מסך ביניים / מודל).
 * סגירה / אחרי שמירה → מעבר ליומן לראות את הרישומים.
 */
export default function LogScreen() {
  const router = useRouter()
  const { loadApproaches } = useLogStore()

  useFocusEffect(
    useCallback(() => {
      analytics.trackScreenView('log')
    }, [])
  )

  useEffect(() => {
    void loadApproaches()
    const unsubscribe = useLogStore.getState().subscribeToChanges()
    return unsubscribe
  }, [loadApproaches])

  const goToJournal = () => {
    router.replace('/(tabs)/journal')
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LogBottomSheet onClose={goToJournal} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
  },
})
