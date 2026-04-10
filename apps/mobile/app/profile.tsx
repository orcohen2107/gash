import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { useRouter, useLocalSearchParams, type Href } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/useAuthStore'
import { SERVER_URL, getAuthHeaders } from '@/lib/server'
import { analytics } from '@/lib/analytics'
import { formatApiErrorJson } from '@/lib/apiErrorMessage'
import { isMainTab, useTabHistoryStore } from '@/stores/useTabHistoryStore'
import { UserAvatarEditor } from '@/components/profile/UserAvatarEditor'
import { fetchAndSyncUserProfile } from '@/lib/userProfileSync'
import type { UserProfile } from '@gash/types'

const BG = '#0e0e0e'
const CARD = '#1a1a1a'
const BORDER = 'rgba(255,255,255,0.08)'
const TEXT = '#ffffff'
const MUTED = '#adaaaa'
const ACCENT = '#81ecff'
const ON_ACCENT = '#003840'

function formatPhoneDisplay(phone: string | undefined): string {
  if (!phone) return '—'
  const d = phone.replace(/\D/g, '')
  if (d.startsWith('972') && d.length >= 11) {
    const rest = d.slice(3)
    if (rest.length === 9) return `0${rest.slice(0, 2)}-${rest.slice(2, 5)}-${rest.slice(5)}`
  }
  return phone
}

function paramFrom(from: string | string[] | undefined): string | undefined {
  if (from == null) return undefined
  return typeof from === 'string' ? from : from[0]
}

function mapProfile(p: {
  name: string | null
  age: number | null
  phone: string | null
  email: string | null
  avatar_url: string | null
}): UserProfile {
  return {
    name: p.name ?? '',
    age: p.age ?? 0,
    email: p.email,
    avatar_url: p.avatar_url,
    phone: p.phone,
  }
}

export default function SettingsProfileScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ from?: string | string[] }>()
  const lastNonProfile = useTabHistoryStore((s) => s.lastNonProfile)
  const session = useAuthStore((s) => s.session)
  const signOut = useAuthStore((s) => s.signOut)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [email, setEmail] = useState('')
  const [phoneSaved, setPhoneSaved] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${SERVER_URL}/api/user/profile`, { headers })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setName('')
        setAge('')
        setEmail('')
        useAuthStore.getState().setUserProfile(null)
        return
      }
      const p = json?.profile as {
        name: string | null
        age: number | null
        phone: string | null
        email: string | null
        avatar_url: string | null
      } | null
      if (p) {
        setName(p.name ?? '')
        setAge(p.age != null ? String(p.age) : '')
        setEmail(p.email ?? '')
        setPhoneSaved(p.phone ?? null)
        useAuthStore.getState().setUserProfile(mapProfile(p))
      } else {
        setName('')
        setAge('')
        setEmail('')
        setPhoneSaved(null)
        useAuthStore.getState().setUserProfile(null)
      }
    } catch {
      setName('')
      setAge('')
      setEmail('')
      setPhoneSaved(null)
      useAuthStore.getState().setUserProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      analytics.trackScreenView('profile')
      loadProfile()
    }, [loadProfile])
  )

  const handleSave = async () => {
    const ageNum = parseInt(age.replace(/\D/g, ''), 10)
    if (!name.trim() || name.trim().length < 2) {
      Toast.show({ type: 'error', text1: 'הזן שם (לפחות 2 תווים)', position: 'bottom' })
      return
    }
    if (Number.isNaN(ageNum) || ageNum < 16 || ageNum > 100) {
      Toast.show({ type: 'error', text1: 'גיל חייב להיות בין 16 ל-100', position: 'bottom' })
      return
    }
    const emailTrim = email.trim()
    if (!emailTrim) {
      Toast.show({ type: 'error', text1: 'נדרש אימייל', position: 'bottom' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      Toast.show({ type: 'error', text1: 'פורמט אימייל לא תקין', position: 'bottom' })
      return
    }

    setSaving(true)
    try {
      const headers = await getAuthHeaders()
      const body = {
        name: name.trim(),
        age: ageNum,
        email: emailTrim.toLowerCase(),
      }
      const res = await fetch(`${SERVER_URL}/api/user/profile`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      const errJson = await res.json().catch(() => ({}))
      if (!res.ok) {
        Toast.show({
          type: 'error',
          text1: formatApiErrorJson(errJson, res.status),
          position: 'bottom',
          visibilityTime: 5000,
        })
        return
      }
      Toast.show({ type: 'success', text1: 'הפרטים נשמרו', position: 'bottom' })
      setPhoneSaved(session?.user?.phone ?? null)
      await fetchAndSyncUserProfile()
    } catch {
      Toast.show({ type: 'error', text1: 'בעיה בחיבור', position: 'bottom' })
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    const from = paramFrom(params.from)
    if (from && isMainTab(from)) {
      router.replace(`/(tabs)/${from}` as Href)
      return
    }
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.replace(`/(tabs)/${lastNonProfile}` as Href)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await signOut()
      router.replace('/auth')
    } catch {
      Toast.show({ type: 'error', text1: 'לא הצלחנו להתנתק. נסה שוב.', position: 'bottom' })
    } finally {
      setLoggingOut(false)
    }
  }

  const phone = phoneSaved ?? session?.user?.phone

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backRow, pressed && styles.backRowPressed]}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="חזרה למסך הקודם"
        >
          <Ionicons name="chevron-forward" size={22} color={ACCENT} style={styles.backIcon} />
          <Text style={styles.backText}>חזרה</Text>
        </Pressable>
        <Text style={styles.title}>הגדרות</Text>
        <Text style={styles.subtitle}>פרטי חשבון, תמונת פרופיל והתנתקות</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <Text style={styles.avatarLabel}>תמונת פרופיל</Text>
          <Text style={styles.avatarHint}>לחץ לבחירת תמונה מהגלריה</Text>
          <View style={styles.avatarWrap}>
            <UserAvatarEditor size={96} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>מספר טלפון</Text>
          <Text style={styles.value}>{formatPhoneDisplay(phone)}</Text>
          <Text style={styles.hint}>לא ניתן לעריכה כאן (מקושר לחשבון)</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>שם</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="השם שלך"
            placeholderTextColor={MUTED}
            editable={!loading}
            textAlign="right"
          />
          <Text style={[styles.label, styles.labelSpaced]}>גיל</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={(t) => setAge(t.replace(/[^0-9]/g, '').slice(0, 3))}
            placeholder="למשל 25"
            placeholderTextColor={MUTED}
            keyboardType="number-pad"
            editable={!loading}
            textAlign="right"
          />
          <Text style={[styles.label, styles.labelSpaced]}>אימייל</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="כתובת אימייל"
            placeholderTextColor={MUTED}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            textAlign="right"
          />
          {loading ? (
            <ActivityIndicator color={ACCENT} style={styles.loader} />
          ) : (
            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={ON_ACCENT} />
              ) : (
                <Text style={styles.saveBtnText}>שמירת פרטים</Text>
              )}
            </Pressable>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>התנתקות</Text>
          <Pressable
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator color="#ff716c" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={22} color="#ff716c" />
                <Text style={styles.logoutText}>התנתק</Text>
              </>
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
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backRowPressed: {
    opacity: 0.75,
  },
  backIcon: {
    transform: [{ scaleX: -1 }],
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: ACCENT,
    writingDirection: 'rtl',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: MUTED,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  avatarSection: {
    marginBottom: 20,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  avatarLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
    textAlign: 'center',
    marginBottom: 4,
    writingDirection: 'rtl',
    alignSelf: 'stretch',
  },
  avatarHint: {
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
    marginBottom: 12,
    writingDirection: 'rtl',
    alignSelf: 'stretch',
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTED,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  labelSpaced: {
    marginTop: 14,
  },
  value: {
    marginTop: 8,
    fontSize: 17,
    color: TEXT,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: MUTED,
    textAlign: 'right',
    writingDirection: 'rtl',
    opacity: 0.85,
  },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: TEXT,
    backgroundColor: '#131313',
  },
  loader: {
    marginTop: 16,
  },
  saveBtn: {
    marginTop: 16,
    backgroundColor: ACCENT,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveBtnPressed: {
    opacity: 0.9,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: ON_ACCENT,
  },
  logoutBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,113,108,0.45)',
    backgroundColor: 'rgba(255,113,108,0.08)',
  },
  logoutBtnPressed: {
    opacity: 0.88,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff716c',
  },
})
