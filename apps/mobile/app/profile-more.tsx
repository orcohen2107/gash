import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'
import { createApiClient } from '@gash/api-client'
import { useAuthStore } from '@/stores/useAuthStore'
import { SERVER_URL, getAuthHeaders, handleAuthError } from '@/lib/server'
import { horizontalGutter } from '@/lib/responsiveLayout'

const BG = '#0e0e0e'
const ACCENT = '#81ecff'
const MUTED = '#adaaaa'
const CARD = '#1a1a1a'
const BORDER = 'rgba(72, 72, 71, 0.1)'

const api = createApiClient({
  serverUrl: SERVER_URL,
  getHeaders: getAuthHeaders,
  onAuthError: handleAuthError,
})

export default function ProfileMoreScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const gutter = horizontalGutter(width)
  const signOut = useAuthStore((s) => s.signOut)
  const [deleting, setDeleting] = useState(false)

  const runDelete = async () => {
    setDeleting(true)
    try {
      await api.user.deleteAccount()
      await signOut()
      router.replace('/auth')
    } catch (e) {
      const msg =
        e instanceof Error && e.message
          ? e.message
          : 'לא הצלחנו למחוק את החשבון. נסה שוב.'
      Toast.show({ type: 'error', text1: msg, position: 'bottom', visibilityTime: 4000 })
    } finally {
      setDeleting(false)
    }
  }

  const confirmDelete = () => {
    Alert.alert(
      'מחיקת חשבון',
      'פעולה זו תמחק לצמיתות את החשבון, כולל גישות, צ\'אט והיסטוריה. לא ניתן לשחזר.',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'המשך',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'לאשר מחיקה?',
              'האם אתה בטוח? לאחר האישור החשבון יימחק.',
              [
                { text: 'ביטול', style: 'cancel' },
                {
                  text: 'מחק חשבון',
                  style: 'destructive',
                  onPress: () => void runDelete(),
                },
              ]
            )
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={[styles.header, { paddingHorizontal: gutter }]}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          פעולות נוספות
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="חזרה"
        >
          <MaterialIcons name="arrow-back" size={24} color={ACCENT} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>חשבון</Text>
        <View style={styles.card}>
          <Pressable
            onPress={confirmDelete}
            disabled={deleting}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="מחיקת חשבון"
          >
            <View style={styles.rowStart}>
              <MaterialIcons name="delete-forever" size={22} color="#ff716c" />
              <Text style={styles.dangerText}>מחיקת חשבון</Text>
            </View>
            {deleting ? (
              <ActivityIndicator color="#ff716c" size="small" />
            ) : (
              <MaterialIcons name="chevron-left" size={22} color={MUTED} />
            )}
          </Pressable>
        </View>

      </ScrollView>
      <Toast />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
    direction: 'rtl',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    minHeight: 56,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: ACCENT,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  headerSpacer: {
    width: 32,
  },
  scroll: {
    paddingBottom: 32,
    paddingTop: 8,
    direction: 'rtl',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  rowStart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dangerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff716c',
    writingDirection: 'rtl',
  },
  pressed: {
    opacity: 0.85,
  },
})
