import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { OfflineQueue } from '@/lib/offlineQueue'
import { useLogStore } from '@/stores/useLogStore'
import Toast from 'react-native-toast-message'

interface OfflineBannerProps {
  isOffline: boolean
}

export function OfflineBanner({ isOffline }: OfflineBannerProps) {
  const [isProcessing, setIsProcessing] = React.useState(false)

  const handleSyncNow = async () => {
    setIsProcessing(true)
    try {
      const { approaches } = useLogStore.getState()
      // Create a minimal client for queue processing
      const client = {
        approaches: {
          create: (data: any) => useLogStore.getState().addApproach(data),
          update: (id: string, data: any) => useLogStore.getState().updateApproach(id, data),
          delete: (id: string) => useLogStore.getState().deleteApproach(id),
        },
      }

      const result = await OfflineQueue.processQueue(client)
      Toast.show({
        type: 'success',
        text1: 'סינכרון הושלם',
        text2: `${result.success} פעולות עודכנו`,
      })
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'שגיאה בסינכרון',
        text2: 'בדוק את החיבור ונסה שוב',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOffline) return null

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <Text style={styles.icon}>📡</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>אתה בחוץ מהרשת</Text>
          <Text style={styles.description}>
            הנתונים שלך יישמרו כשתחזור לרשת
          </Text>
        </View>
      </View>
      <Pressable
        onPress={handleSyncNow}
        disabled={isProcessing}
        style={[styles.syncButton, isProcessing && styles.syncButtonDisabled]}
      >
        <Text style={styles.syncButtonText}>
          {isProcessing ? 'מסנכרן...' : 'סנכרן עכשיו'}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
    marginEnd: 8,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: '#adaaaa',
  },
  syncButton: {
    backgroundColor: '#81ecff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  syncButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
})
