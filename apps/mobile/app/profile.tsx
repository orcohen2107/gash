import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
  Switch,
  Linking,
} from 'react-native'
import { useRouter, useLocalSearchParams, type Href } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { MaterialIcons } from '@expo/vector-icons'
import Constants from 'expo-constants'
import { useAuthStore } from '@/stores/useAuthStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { SERVER_URL, getAuthHeaders } from '@/lib/server'
import { analytics } from '@/lib/analytics'
import { formatApiErrorJson } from '@/lib/apiErrorMessage'
import { isMainTab, useTabHistoryStore } from '@/stores/useTabHistoryStore'
import { UserAvatarEditor } from '@/components/profile/UserAvatarEditor'
import { fetchAndSyncUserProfile } from '@/lib/userProfileSync'
import type { UserProfile } from '@gash/types'
import { horizontalGutter } from '@/lib/responsiveLayout'

const BG = '#0e0e0e'
const SURFACE_LOW = '#131313'
const SURFACE = '#1a1a1a'
const SURFACE_HIGH = '#20201f'
const BORDER = 'rgba(72, 72, 71, 0.1)'
const TEXT = '#ffffff'
const MUTED = '#adaaaa'
const ACCENT = '#81ecff'
const ON_ACCENT = '#003840'
const PRIMARY_DIM = '#00d4ec'

const SUPPORT_MAIL = 'mailto:support@gash.app'

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
  const { width } = useWindowDimensions()
  const gutter = horizontalGutter(width)
  const params = useLocalSearchParams<{ from?: string | string[] }>()
  const lastNonProfile = useTabHistoryStore((s) => s.lastNonProfile)
  const session = useAuthStore((s) => s.session)
  const signOut = useAuthStore((s) => s.signOut)

  const aiTipsNotifications = useSettingsStore((s) => s.aiTipsNotifications)
  const setAiTipsNotifications = useSettingsStore((s) => s.setAiTipsNotifications)
  const reminderNotifications = useSettingsStore((s) => s.reminderNotifications)
  const setReminderNotifications = useSettingsStore((s) => s.setReminderNotifications)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [email, setEmail] = useState('')
  const [phoneSaved, setPhoneSaved] = useState<string | null>(null)

  const appVersion = Constants.expoConfig?.version ?? '—'

  const loadProfile = useCallback(async () => {
    const hasCache = !!useAuthStore.getState().userProfile
    if (!hasCache) {
      setLoading(true)
    }
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
    }, [])
  )

  useEffect(() => {
    const p = useAuthStore.getState().userProfile
    if (p) {
      setName(p.name ?? '')
      setAge(p.age != null ? String(p.age) : '')
      setEmail(p.email ?? '')
      setPhoneSaved(p.phone ?? null)
    }
    void loadProfile()
  }, [loadProfile])

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
      await fetchAndSyncUserProfile({ force: true })
      setEditOpen(false)
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

  const openHelp = async () => {
    try {
      const can = await Linking.canOpenURL(SUPPORT_MAIL)
      if (can) await Linking.openURL(SUPPORT_MAIL)
      else Toast.show({ type: 'info', text1: 'לא ניתן לפתוח את תיבת הדואר', position: 'bottom' })
    } catch {
      Toast.show({ type: 'error', text1: 'לא ניתן לפתוח את תיבת הדואר', position: 'bottom' })
    }
  }

  const phone = phoneSaved ?? session?.user?.phone
  const ageNum = parseInt(age.replace(/\D/g, ''), 10)
  const subtitle =
    !Number.isNaN(ageNum) && ageNum > 0 ? `בן ${ageNum}` : loading ? '…' : 'השלם פרופיל'

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={[styles.topBar, { paddingHorizontal: gutter }]}>
        <Text style={styles.topTitle} numberOfLines={1}>
          הגדרות
        </Text>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.iconRound, pressed && styles.pressed]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="חזרה"
        >
          <MaterialIcons name="arrow-back" size={24} color={ACCENT} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter, paddingBottom: 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>פרופיל</Text>
          <Pressable onPress={() => setEditOpen(true)} hitSlop={8}>
            <Text style={styles.updateLink}>עדכון</Text>
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              <UserAvatarEditor size={64} />
              <View style={styles.editBadge} pointerEvents="none">
                <MaterialIcons name="edit" size={14} color={ON_ACCENT} />
              </View>
            </View>
            <View style={styles.profileText}>
              <Text style={styles.displayName} numberOfLines={1}>
                {name.trim() || 'שם משתמש'}
              </Text>
              <Text style={styles.displaySub}>{subtitle}</Text>
            </View>
          </View>

          <View style={styles.phoneRow}>
            <View style={styles.phoneLeft}>
              <MaterialIcons name="call" size={22} color={PRIMARY_DIM} />
              <Text style={styles.phoneLabel}>מספר טלפון</Text>
            </View>
            <Text style={styles.phoneValue}>{formatPhoneDisplay(phone)}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>התראות</Text>
        <View style={styles.notifCard}>
          <View style={styles.notifRow}>
            <View style={styles.notifStart}>
              <View style={styles.iconBg}>
                <MaterialIcons name="psychology" size={22} color={ACCENT} />
              </View>
              <View>
                <Text style={styles.notifTitle}>טיפים של ה-AI</Text>
                <Text style={styles.notifSub}>תובנות אישיות לשיפור השיחה</Text>
              </View>
            </View>
            <Switch
              value={aiTipsNotifications}
              onValueChange={setAiTipsNotifications}
              trackColor={{ false: '#262626', true: 'rgba(129,236,255,0.45)' }}
              thumbColor={aiTipsNotifications ? ACCENT : '#f4f4f4'}
            />
          </View>
          <View style={styles.notifRow}>
            <View style={styles.notifStart}>
              <View style={styles.iconBg}>
                <MaterialIcons name="notifications-active" size={22} color={ACCENT} />
              </View>
              <View>
                <Text style={styles.notifTitle}>תזכורות</Text>
                <Text style={styles.notifSub}>עדכונים על התקדמות ומשימות</Text>
              </View>
            </View>
            <Switch
              value={reminderNotifications}
              onValueChange={setReminderNotifications}
              trackColor={{ false: '#262626', true: 'rgba(129,236,255,0.45)' }}
              thumbColor={reminderNotifications ? ACCENT : '#f4f4f4'}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>חשבון</Text>
        <View style={styles.accountCard}>
          <Pressable
            style={({ pressed }) => [styles.accountRow, pressed && styles.pressed]}
            onPress={() =>
              Toast.show({
                type: 'info',
                text1: 'האפליקציה זמינה כרגע בעברית בלבד',
                position: 'bottom',
              })
            }
          >
            <View style={styles.accountStart}>
              <MaterialIcons name="translate" size={22} color={PRIMARY_DIM} />
              <Text style={styles.accountLabel}>החלף שפה</Text>
            </View>
            <View style={styles.accountEnd}>
              <Text style={styles.accountValue}>עברית</Text>
              <MaterialIcons name="chevron-left" size={22} color={MUTED} />
            </View>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={({ pressed }) => [styles.accountRow, pressed && styles.pressed]}
            onPress={openHelp}
          >
            <View style={styles.accountStart}>
              <MaterialIcons name="help-center" size={22} color={PRIMARY_DIM} />
              <Text style={styles.accountLabel}>מרכז עזרה</Text>
            </View>
            <MaterialIcons name="chevron-left" size={22} color={MUTED} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={({ pressed }) => [styles.accountRow, pressed && styles.pressed]}
            onPress={() => router.push('/profile-more')}
          >
            <View style={styles.accountStart}>
              <MaterialIcons name="more-horiz" size={22} color={PRIMARY_DIM} />
              <Text style={styles.accountLabel}>פעולות נוספות</Text>
            </View>
            <MaterialIcons name="chevron-left" size={22} color={MUTED} />
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [styles.logoutCard, pressed && styles.pressed]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color="#ff716c" />
          ) : (
            <>
              <Text style={styles.logoutText}>התנתק</Text>
              <MaterialIcons name="logout" size={24} color="#ff716c" />
            </>
          )}
        </Pressable>

        <Text style={styles.version}>
          גרסה {appVersion}
          {__DEV__ ? ' (פיתוח)' : ''}
        </Text>
      </ScrollView>

      <Modal visible={editOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditOpen(false)}>
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <View style={[styles.modalHeader, { paddingHorizontal: gutter }]}>
            <Pressable onPress={() => setEditOpen(false)} hitSlop={10}>
              <Text style={styles.modalCancel}>ביטול</Text>
            </Pressable>
            <Text style={styles.modalTitle}>עדכון פרופיל</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: gutter,
              paddingBottom: 40,
              direction: 'rtl',
            }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalHint}>לשינוי תמונת הפרופיל סגור את החלון ולחץ על התמונה למעלה</Text>
            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>שם</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="השם שלך"
                placeholderTextColor={MUTED}
                editable={!loading}
                textAlign="right"
              />
              <Text style={[styles.inputLabel, styles.inputLabelSpaced]}>גיל</Text>
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
              <Text style={[styles.inputLabel, styles.inputLabelSpaced]}>אימייל</Text>
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
                <ActivityIndicator color={ACCENT} style={{ marginTop: 20 }} />
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
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
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: BG,
  },
  topTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: ACCENT,
    writingDirection: 'rtl',
  },
  iconRound: {
    padding: 8,
    borderRadius: 999,
  },
  pressed: {
    opacity: 0.88,
  },
  scroll: {
    paddingTop: 4,
    direction: 'rtl',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionTitleSpaced: {
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'right',
    alignSelf: 'stretch',
  },
  updateLink: {
    fontSize: 14,
    fontWeight: '700',
    color: ACCENT,
  },
  profileCard: {
    backgroundColor: SURFACE_LOW,
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    end: -2,
    backgroundColor: ACCENT,
    padding: 4,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  displayName: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  displaySub: {
    marginTop: 4,
    fontSize: 14,
    color: MUTED,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  phoneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  phoneLabel: {
    fontSize: 15,
    color: TEXT,
    writingDirection: 'rtl',
  },
  phoneValue: {
    fontSize: 13,
    fontWeight: '500',
    color: MUTED,
    writingDirection: 'rtl',
  },
  notifCard: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    overflow: 'hidden',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  notifStart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  iconBg: {
    backgroundColor: 'rgba(129,236,255,0.1)',
    padding: 8,
    borderRadius: 8,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  notifSub: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  accountCard: {
    backgroundColor: SURFACE_LOW,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  accountStart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accountLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: TEXT,
    writingDirection: 'rtl',
  },
  accountEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accountValue: {
    fontSize: 14,
    color: MUTED,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(72, 72, 71, 0.25)',
    marginHorizontal: 16,
  },
  logoutCard: {
    marginTop: 28,
    backgroundColor: SURFACE_HIGH,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(159,5,25,0.15)',
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ff716c',
    writingDirection: 'rtl',
  },
  version: {
    marginTop: 22,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '500',
    color: MUTED,
    letterSpacing: 0.5,
    writingDirection: 'rtl',
  },
  modalSafe: {
    flex: 1,
    backgroundColor: BG,
    direction: 'rtl',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalHeaderSpacer: {
    width: 48,
  },
  modalCancel: {
    fontSize: 16,
    color: MUTED,
    minWidth: 48,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  modalTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: TEXT,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  modalHint: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'right',
    marginBottom: 16,
    writingDirection: 'rtl',
  },
  formCard: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTED,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  inputLabelSpaced: {
    marginTop: 14,
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
    backgroundColor: SURFACE_LOW,
    writingDirection: 'rtl',
  },
  saveBtn: {
    marginTop: 20,
    backgroundColor: ACCENT,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: ON_ACCENT,
  },
})
