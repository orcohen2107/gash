import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import NetInfo from '@react-native-community/netinfo'
import { OfflineQueue } from '@/lib/offlineQueue'
import { useLogStore } from '@/stores/useLogStore'
import Toast from 'react-native-toast-message'

interface OfflineBannerProps {
  isOffline: boolean
}

function isNetOffline(state: {
  isConnected: boolean | null
  isInternetReachable: boolean | null
}): boolean {
  return state.isConnected === false || state.isInternetReachable === false
}

export function OfflineBanner({ isOffline }: OfflineBannerProps) {
  const insets = useSafeAreaInsets()
  const [isProcessing, setIsProcessing] = React.useState(false)

  /** בודק שוב את הרשת דרך המערכת; אם יש רשת — מריץ תור פעולות שנשמרו במכשיר (גישות וכו') */
  const handleRetry = async () => {
    setIsProcessing(true)
    try {
      await NetInfo.refresh()
      const latest = await NetInfo.fetch()

      if (isNetOffline(latest)) {
        Toast.show({
          type: 'info',
          text1: 'עדיין אין חיבור',
          text2: 'כשהרשת תחזור הנתונים יישלחו אוטומטית',
        })
        return
      }

      const client = {
        approaches: {
          create: (data: any) => useLogStore.getState().addApproach(data),
          update: (id: string, data: any) => useLogStore.getState().updateApproach(id, data),
          delete: (id: string) => useLogStore.getState().deleteApproach(id),
        },
      }

      const result = await OfflineQueue.processQueue(client)

      if (result.success > 0) {
        Toast.show({
          type: 'success',
          text1: 'נשמר בשרת',
          text2:
            result.success === 1
              ? 'פעולה אחת הושלמה'
              : `${result.success} פעולות הושלמו`,
        })
      } else if (result.failed > 0) {
        Toast.show({
          type: 'error',
          text1: 'חלק מהפעולות נכשלו',
          text2: 'נסה שוב בעוד רגע',
        })
      }
      /* תור ריק + יש רשת — בלי טוסט (לא מבלבל עם "החיבור חזר") */
    } catch {
      Toast.show({
        type: 'error',
        text1: 'לא הצלחנו לסנכרן',
        text2: 'נסה שוב בעוד רגע',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOffline) return null

  return (
    <View
      style={[
        styles.banner,
        {
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>📡</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>אין חיבור לאינטרנט</Text>
          <Text style={styles.description}>
            מה שתשמור יישאר במכשיר ויישלח כשהחיבור יחזור. כפתור «נסה שוב» בודק שוב אם יש רשת
            ומעלה פעולות שממתינות.
          </Text>
        </View>
      </View>
      <Pressable
        onPress={handleRetry}
        disabled={isProcessing}
        style={[styles.syncButton, isProcessing && styles.syncButtonDisabled]}
      >
        <Text style={styles.syncButtonText}>
          {isProcessing ? 'בודק…' : 'נסה שוב'}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    backgroundColor: '#2d2d2d',
    borderTopWidth: 1,
    borderTopColor: '#444444',
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  icon: {
    fontSize: 20,
    marginEnd: 10,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    color: '#adaaaa',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  syncButton: {
    backgroundColor: '#81ecff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.55,
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
})
