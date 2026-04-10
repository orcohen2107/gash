import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Pressable,
  Animated,
  useWindowDimensions,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import Toast from 'react-native-toast-message'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '@/lib/supabase'
import { SERVER_URL, getAuthHeaders } from '@/lib/server'
import { useAuthStore } from '@/stores/useAuthStore'
import { DEV_TEST_OTP, isDevTestPhone } from '@/lib/auth-dev'
import { formatApiErrorJson } from '@/lib/apiErrorMessage'
import { AuthScreenBackdrop, authSurfaceColor } from '@/components/auth/AuthScreenBackdrop'

const ACCENT = '#81ecff'
const ACCENT_SOFT = '#81ecff'
const ACCENT_END = '#00d4ec'
const BUTTON_LABEL = '#003840'
const MUTED = '#adaaaa'
const CELL_BG = '#20201f'
const OTP_LEN = 6

const TOAST_DURATION_MS = 3000

function showErrorToast(message: string) {
  Toast.show({ type: 'error', text1: message, position: 'bottom', autoHide: true, visibilityTime: TOAST_DURATION_MS })
}

export default function VerifyScreen() {
  const router = useRouter()
  const { height } = useWindowDimensions()
  const { phone, name, age, email, isRegister } = useLocalSearchParams<{
    phone: string
    name?: string
    age?: string
    email?: string
    isRegister?: string
  }>()

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const hiddenRef = useRef<TextInput>(null)
  const progressAnim = useRef(new Animated.Value(0)).current
  /** מונע שתי קריאות מקבילות ל-verifyOtp (במיוחד React Strict Mode — השנייה נכשלת כי הקוד כבר נוצל) */
  const verifyInFlightRef = useRef(false)
  const verifySucceededRef = useRef(false)

  const saveProfile = useCallback(async () => {
    if (!name || !age) return
    const em = email?.trim()
    if (!em) {
      showErrorToast('נדרש אימייל — חזור למסך ההרשמה והזן כתובת')
      return
    }
    try {
      const headers = await getAuthHeaders()
      const payload = {
        name,
        age: parseInt(age, 10),
        email: em.toLowerCase(),
      }
      const res = await fetch(`${SERVER_URL}/api/user/profile`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        console.error('[verify] saveProfile failed:', res.status, errJson)
        showErrorToast(formatApiErrorJson(errJson, res.status))
      }
    } catch (e) {
      console.error('[verify] saveProfile', e)
      if (__DEV__) {
        showErrorToast('לא הצלחנו לשמור פרופיל — בדוק חיבור לשרת (LAN / פורט 3001).')
      }
      // Non-blocking — user can still proceed; profile can be saved later from settings if added.
    }
  }, [name, age, email])

  const submitOtp = useCallback(
    async (code: string) => {
      if (!phone) {
        showErrorToast('שגיאה: לא קיבלנו מספר טלפון')
        return
      }

      if (!/^\d{4,6}$/.test(code)) return

      if (verifySucceededRef.current || verifyInFlightRef.current) return
      verifyInFlightRef.current = true

      setLoading(true)
      try {
        const { error, data } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' })
        const newSession = data?.session

        if (error) {
          const errCode = 'code' in error ? String((error as { code?: string }).code) : ''
          const devHint =
            __DEV__ && isDevTestPhone(phone)
              ? ` בפיתוח: ב-Supabase → Phone → Test phone numbers צריך בדיוק ${phone}=${DEV_TEST_OTP} (כולל + וכל הספרות).`
              : ''
          let userMsg: string
          if (errCode === 'otp_expired' || /expired|invalid/i.test(error.message)) {
            userMsg = __DEV__
              ? `קוד פג / לא תואם למספר. נשלח: ${phone}. בדוק ב-Supabase Test phone אותו מספר בדיוק (+ וספרות).`
              : 'הקוד פג או לא תקף. לחץ על שליחה מחדש או הזן קוד עדכני.'
          } else if (error.message.includes('Invalid')) {
            userMsg = 'קוד לא נכון. בדוק שוב.'
          } else {
            userMsg = 'בעיה בחיבור. בדוק את הרשת.'
          }
          showErrorToast(userMsg + devHint)
          setOtp('')
        } else if (newSession?.access_token) {
          verifySucceededRef.current = true
          // מסנכרן מיד ל-Zustand כדי שלא יהיה race עם Redirect ב-(tabs) לפני onAuthStateChange
          useAuthStore.getState().setSession(newSession)
          useAuthStore.getState().setLoading(false)

          if (isRegister === '1') {
            await saveProfile()
          }
          router.replace('/(tabs)/tips')
        } else {
          showErrorToast('לא התקבל מושב מהשרת. נסה שוב.')
          setOtp('')
        }
      } catch (e) {
        console.error('[verify] submitOtp', e)
        showErrorToast(
          __DEV__ && e instanceof Error
            ? `שגיאה: ${e.message}`
            : 'בעיה בחיבור. בדוק את הרשת.'
        )
      } finally {
        verifyInFlightRef.current = false
        setLoading(false)
      }
    },
    [phone, router, isRegister, saveProfile]
  )

  useEffect(() => {
    if (otp.length === 6) {
      submitOtp(otp)
    }
  }, [otp, submitOtp])

  useEffect(() => {
    if (loading) {
      progressAnim.setValue(0)
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: false,
      }).start()
    }
  }, [loading, progressAnim])

  const handleOtpChange = (t: string) => {
    const next = t.replace(/[^0-9]/g, '').slice(0, OTP_LEN)
    setOtp(next)
  }

  const handleResend = async () => {
    if (!phone) {
      showErrorToast('שגיאה: לא קיבלנו מספר טלפון')
      return
    }
    setResendLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone })
      if (error) {
        showErrorToast('בעיה בשליחה. בדוק את הרשת.')
      } else {
        Toast.show({ type: 'success', text1: 'קוד חדש נשלח!', position: 'bottom', autoHide: true, visibilityTime: 2000 })
        setOtp('')
      }
    } catch {
      showErrorToast('בעיה בחיבור. בדוק את הרשת.')
    } finally {
      setResendLoading(false)
    }
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['8%', '100%'],
  })

  const cells = Array.from({ length: OTP_LEN }, (_, i) => otp[i] ?? '')

  return (
    <SafeAreaView style={styles.safe}>
      <AuthScreenBackdrop />
      <ScrollView
        contentContainerStyle={[styles.scroll, { minHeight: height * 0.92 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.main}>
          <Pressable style={styles.headerTap} onPress={() => hiddenRef.current?.focus()}>
            <Text style={styles.title}>בדוק את הקוד</Text>
            <Text style={styles.subtitle}>הזן את הקוד שקיבלת ב-SMS</Text>
            {__DEV__ && isDevTestPhone(phone) ? (
              <Text style={styles.devHint}>
                מצב פיתוח: למספר בדיקה לא נשלח SMS. השתמש בקוד מה-Supabase (לרוב {DEV_TEST_OTP}).
              </Text>
            ) : null}
          </Pressable>

          <TextInput
            ref={hiddenRef}
            value={otp}
            onChangeText={handleOtpChange}
            keyboardType="number-pad"
            maxLength={OTP_LEN}
            editable={!loading}
            style={styles.hiddenInput}
            autoFocus
            accessibilityLabel="קוד אימות"
          />

          <Pressable style={styles.otpRow} onPress={() => hiddenRef.current?.focus()}>
            {cells.map((ch, i) => {
              const focused = otp.length === i && !loading
              const filled = ch !== ''
              return (
                <View
                  key={i}
                  style={[
                    styles.otpCell,
                    focused && styles.otpCellFocused,
                    filled && !focused && styles.otpCellFilled,
                  ]}
                >
                  <Text style={styles.otpChar}>{ch}</Text>
                </View>
              )
            })}
          </Pressable>

          <View style={styles.progressTrack}>
            {loading ? (
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            ) : (
              <View style={[styles.progressFill, { width: `${Math.min(100, (otp.length / OTP_LEN) * 100)}%` }]} />
            )}
          </View>

          {loading ? (
            <View style={styles.verifyRow}>
              <ActivityIndicator size="small" color={ACCENT} />
              <Text style={styles.verifyText}>מאמת את הקוד...</Text>
            </View>
          ) : (
            <View style={styles.verifyRowPlaceholder} />
          )}

          <TouchableOpacity
            activeOpacity={0.88}
            disabled={loading || otp.length < 4}
            onPress={() => submitOtp(otp)}
            style={[styles.ctaOuter, (loading || otp.length < 4) && styles.ctaDisabled]}
          >
            <LinearGradient
              colors={[ACCENT_SOFT, ACCENT_END]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>אימות והמשך</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.resendBlock}>
            <Text style={styles.resendQuestion}>לא קיבלת קוד?</Text>
            <TouchableOpacity onPress={handleResend} disabled={resendLoading || loading}>
              <Text style={styles.resendLink}>{resendLoading ? 'שולח...' : 'שלח שוב'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>נשלח אל {phone}</Text>
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: authSurfaceColor,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  main: {
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
  },
  headerTap: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Inter',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: MUTED,
    textAlign: 'center',
    fontFamily: 'Inter',
    marginBottom: 12,
    lineHeight: 24,
  },
  devHint: {
    fontSize: 13,
    color: ACCENT,
    textAlign: 'center',
    fontFamily: 'Inter',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 18,
  },
  otpCell: {
    width: 48,
    height: 52,
    borderRadius: 12,
    backgroundColor: CELL_BG,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpCellFocused: {
    borderColor: ACCENT,
    borderWidth: 2,
    shadowColor: ACCENT,
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  otpCellFilled: {
    borderColor: '#4b5563',
  },
  otpChar: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2a2a2a',
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: ACCENT,
  },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 18,
    minHeight: 22,
  },
  verifyRowPlaceholder: {
    minHeight: 22,
    marginBottom: 18,
  },
  verifyText: {
    fontSize: 14,
    color: '#f3f4f6',
    fontFamily: 'Inter',
  },
  ctaOuter: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: ACCENT_END,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  ctaDisabled: {
    opacity: 0.45,
  },
  ctaGradient: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '800',
    color: BUTTON_LABEL,
    fontFamily: 'Inter',
  },
  resendBlock: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  resendQuestion: {
    fontSize: 14,
    color: MUTED,
    fontFamily: 'Inter',
  },
  resendLink: {
    fontSize: 15,
    color: ACCENT,
    fontFamily: 'Inter',
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
})
