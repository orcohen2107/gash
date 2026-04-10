import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Text,
  TouchableOpacity,
  TextInput,
  Linking,
  Image,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Toast from 'react-native-toast-message'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { DEV_TEST_OTP, isDevTestPhone } from '@/lib/auth-dev'
import { AuthScreenBackdrop, authSurfaceColor } from '@/components/auth/AuthScreenBackdrop'

/**
 * תמונת הגיבור (שני אנשים) — קובץ: assets/images/auth-login-hero.png
 * רק אם מגדירים EXPO_PUBLIC_AUTH_DECOR_IMAGE_URL (URL מלא) נטען מרשת במקום הקובץ המקומי.
 */
const loginHeroSource =
  process.env.EXPO_PUBLIC_AUTH_DECOR_IMAGE_URL != null && process.env.EXPO_PUBLIC_AUTH_DECOR_IMAGE_URL !== ''
    ? { uri: process.env.EXPO_PUBLIC_AUTH_DECOR_IMAGE_URL }
    : require('../../assets/images/auth-login-hero.png')

const PRIMARY = '#81ecff'
const ACCENT_SOFT = '#81ecff'
const ACCENT_END = '#00d4ec'
const BUTTON_LABEL = '#003840'
const MUTED = '#adaaaa'
const OUTLINE_VARIANT = '#484847'
const SURFACE_HIGH = '#20201f'

const localPhoneSchema = z.object({
  localPhone: z
    .string()
    .min(1, 'הזן מספר טלפון')
    .refine((v) => {
      const d = v.replace(/\D/g, '')
      if (d.length === 9 && /^5[0-9]{8}$/.test(d)) return true
      if (d.length === 10 && /^05[0-9]{8}$/.test(d)) return true
      return false
    }, 'מספר לא חוקי. תן מספר ישראלי.'),
})

type PhoneFormData = z.infer<typeof localPhoneSchema>

function normalizeToE164(local: string): string {
  const d = local.replace(/\D/g, '')
  const core = d.startsWith('0') ? d.slice(1) : d
  return `+972${core}`
}

export default function LoginScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [phoneFocused, setPhoneFocused] = useState(false)

  const { control, handleSubmit } = useForm<PhoneFormData>({
    resolver: zodResolver(localPhoneSchema),
    defaultValues: { localPhone: '' },
  })

  const handlePhoneSubmit = async (data: PhoneFormData) => {
    setLoading(true)
    try {
      const phone = normalizeToE164(data.localPhone)

      const { error } = await supabase.auth.signInWithOtp({ phone })

      if (error) {
        Toast.show({
          type: 'error',
          text1: error.message.includes('phone') ? 'מספר לא חוקי.' : 'בעיה בחיבור. בדוק את הרשת.',
          position: 'bottom',
          visibilityTime: 3000,
        })
      } else {
        if (__DEV__ && isDevTestPhone(phone)) {
          Toast.show({
            type: 'info',
            text1: 'מצב פיתוח',
            text2: `לא נשלח SMS. הקוד: ${DEV_TEST_OTP}`,
            position: 'bottom',
            visibilityTime: 5000,
          })
        }
        router.push({ pathname: '/auth/verify', params: { phone } })
      }
    } catch {
      Toast.show({ type: 'error', text1: 'בעיה בחיבור. בדוק את הרשת.', position: 'bottom', visibilityTime: 3000 })
    } finally {
      setLoading(false)
    }
  }

  const openLegal = (which: 'terms' | 'privacy') => {
    const url =
      which === 'terms'
        ? process.env.EXPO_PUBLIC_TERMS_URL
        : process.env.EXPO_PUBLIC_PRIVACY_URL
    if (url) {
      Linking.openURL(url)
    } else {
      Toast.show({
        type: 'info',
        text1: 'קישור יתווסף בקרוב',
        position: 'bottom',
        visibilityTime: 2000,
      })
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AuthScreenBackdrop />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces
      >
        <View style={styles.main}>
          <View style={styles.sectionTop}>
            <View style={styles.iconWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={36} color={PRIMARY} />
            </View>

            <Text style={styles.title}>ברוכים הבאים לגש 🚀</Text>
            <Text style={styles.subtitle}>הזן את מספר הטלפון שלך</Text>
          </View>

          <View style={styles.sectionMiddle}>
            <View style={styles.fieldBlock}>
              {/* LTR: אייקון משמאל למסך, «טלפון נייד» מימין (תמיד, גם אם RTL) */}
              <View style={styles.labelRowLtr}>
                <Ionicons name="phone-portrait-outline" size={18} color="rgba(129,236,255,0.4)" />
                <Text style={styles.fieldLabel}>טלפון נייד</Text>
              </View>

              <Controller
                control={control}
                name="localPhone"
                render={({ field: { value, onChange }, fieldState: { error } }) => (
                  <>
                    {/* כמו ב-HTML: +972 ראשון ב-RTL (מימין), input עם מספרים dir ltr */}
                    <View style={[styles.phoneRow, phoneFocused && styles.phoneRowFocused]}>
                      <View style={styles.prefixBox}>
                        <Text style={[styles.prefixText, phoneFocused && styles.prefixTextFocused]}>+972</Text>
                      </View>
                      <View style={styles.phoneDivider} />
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="50 123 4567"
                        placeholderTextColor="rgba(173,170,170,0.3)"
                        value={value}
                        onChangeText={onChange}
                        keyboardType="phone-pad"
                        maxLength={12}
                        textContentType="telephoneNumber"
                        autoComplete="tel-national"
                        editable={!loading}
                        onFocus={() => setPhoneFocused(true)}
                        onBlur={() => setPhoneFocused(false)}
                        textAlign="left"
                      />
                    </View>
                    {error?.message ? <Text style={styles.fieldError}>{error.message}</Text> : null}
                  </>
                )}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleSubmit(handlePhoneSubmit)}
              disabled={loading}
              style={styles.ctaOuter}
            >
              <LinearGradient
                colors={[ACCENT_SOFT, ACCENT_END]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>{loading ? 'שולח...' : 'שלח קוד'}</Text>
                <Ionicons name="arrow-back" size={24} color={BUTTON_LABEL} />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.smsNote}>
              <Ionicons name="shield-checkmark" size={18} color="rgba(173,170,170,0.6)" />
              <Text style={styles.smsNoteText}>נשלח ל-SMS בחינם</Text>
            </View>

            <View style={styles.decorWrap}>
              <Image
                source={loginHeroSource}
                style={styles.decorImageFocal}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
              {/* רק מלמטה (כמו bg-gradient-to-t ב-HTML) — בלי פס כהה למעלה על הפנים */}
              <LinearGradient
                colors={['rgba(14,14,14,0)', 'rgba(14,14,14,0.35)', '#0e0e0e']}
                locations={[0, 0.55, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.decorGradient}
              />
            </View>

            <Text style={styles.legal}>
              בהתחברות, אתה מאשר את{' '}
              <Text style={styles.legalLink} onPress={() => openLegal('terms')}>
                תנאי השימוש
              </Text>{' '}
              ו
              <Text style={styles.legalLink} onPress={() => openLegal('privacy')}>
                מדיניות הפרטיות
              </Text>{' '}
              שלנו
            </Text>

            <View style={styles.accountBlock}>
              <Text style={styles.accountHeading}>אין לך משתמש?</Text>
              <TouchableOpacity onPress={() => router.push('/auth/register')} hitSlop={10} accessibilityRole="link">
                <Text style={styles.switchLink}>הירשם כאן</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  /* פחות ריווח עליון — לראות את הכותרת בלי גלילה */
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  main: {
    width: '100%',
    alignSelf: 'stretch',
  },
  sectionTop: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionMiddle: {
    width: '100%',
    alignItems: 'center',
  },
  /* w-20 h-20 rounded-full */
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SURFACE_HIGH,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(72, 72, 71, 0.15)',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 4,
  },
  /* text-4xl font-extrabold tracking-tighter */
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Inter',
    letterSpacing: -0.75,
    marginBottom: 12,
  },
  /* text-lg text-on-surface-variant tracking-wide */
  subtitle: {
    fontSize: 18,
    color: MUTED,
    textAlign: 'center',
    fontFamily: 'Inter',
    lineHeight: 28,
    letterSpacing: 0.4,
  },
  /* middle: space-y-8 (= 32) בין שדה לכפתור */
  fieldBlock: {
    width: '100%',
    marginBottom: 24,
  },
  labelRowLtr: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
    width: '100%',
    direction: 'ltr',
  },
  /* text-[11px] font-bold tracking-widest text-primary/80 */
  fieldLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(129, 236, 255, 0.8)',
    fontFamily: 'Inter',
    letterSpacing: 2.5,
    textAlign: 'right',
  },
  /* rounded-t-xl border-b-2, שורה RTL: +972 מימין */
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE_HIGH,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 2,
    borderBottomColor: OUTLINE_VARIANT,
    minHeight: 64,
    overflow: 'hidden',
  },
  phoneRowFocused: {
    borderBottomColor: PRIMARY,
  },
  /* +972: px-4 text-lg font-bold */
  prefixBox: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  prefixText: {
    color: MUTED,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  prefixTextFocused: {
    color: PRIMARY,
  },
  phoneDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(72, 72, 71, 0.2)',
    marginVertical: 16,
  },
  /* py-5 px-4 text-xl tracking-widest */
  phoneInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter',
    paddingVertical: 20,
    paddingHorizontal: 16,
    letterSpacing: 2,
  },
  fieldError: {
    marginTop: 10,
    fontSize: 13,
    color: '#ff716c',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  /* primary-gradient rounded-xl shadow, py-5 text-lg gap-3 */
  ctaOuter: {
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: ACCENT_END,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  ctaGradient: {
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '800',
    color: BUTTON_LABEL,
    fontFamily: 'Inter',
  },
  /* bottom: space-y-8 */
  smsNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  smsNoteText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(173, 170, 170, 0.6)',
    fontFamily: 'Inter',
    letterSpacing: 0.2,
  },
  /* aspect-[21/9] rounded-2xl */
  decorWrap: {
    width: '100%',
    aspectRatio: 21 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(72, 72, 71, 0.1)',
    backgroundColor: SURFACE_HIGH,
  },
  /* הזזת מיקוד: פחות «ריק» בחלק העליון, הזוג יותר במרכז המסגרת */
  decorImageFocal: {
    position: 'absolute',
    width: '100%',
    height: '175%',
    top: '-32%',
    start: 0,
  },
  decorGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  /* text-[11px] max-w-[280px] */
  legal: {
    fontSize: 11,
    lineHeight: 18,
    color: 'rgba(173, 170, 170, 0.4)',
    textAlign: 'center',
    fontFamily: 'Inter',
    maxWidth: 280,
    alignSelf: 'center',
    marginBottom: 24,
  },
  legalLink: {
    color: 'rgba(173, 170, 170, 0.8)',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  accountBlock: {
    alignItems: 'center',
    gap: 10,
    paddingBottom: 16,
  },
  accountHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTED,
    fontFamily: 'Inter',
  },
  switchLink: {
    fontSize: 15,
    color: PRIMARY,
    fontFamily: 'Inter',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
})
