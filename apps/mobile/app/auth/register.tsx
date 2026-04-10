import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Platform,
  useWindowDimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Toast from 'react-native-toast-message'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { SERVER_URL } from '@/lib/server'
import { DEV_TEST_OTP, isDevTestPhone } from '@/lib/auth-dev'
import { formatApiErrorJson } from '@/lib/apiErrorMessage'
import { AuthScreenBackdrop, authSurfaceColor } from '@/components/auth/AuthScreenBackdrop'

/** טוקנים תואמי עיצוב HTML (Material / Digital Architect) */
const PRIMARY = '#81ecff'
const PRIMARY_DIM = '#00d4ec'
const ON_PRIMARY_FIXED = '#003840'
const ON_SURFACE = '#ffffff'
const ON_SURFACE_VARIANT = '#adaaaa'
const OUTLINE_VARIANT = '#484847'
const SURFACE_CONTAINER_LOW = '#131313'
const SURFACE_CONTAINER_HIGH = '#20201f'
const CARD_BORDER = 'rgba(255, 255, 255, 0.05)'
const PLACEHOLDER = 'rgba(115, 115, 115, 0.9)'

const MSG_PHONE_ALREADY_REGISTERED = 'פציפופה, נראה שאתה כבר מחובר — כבר יש לך חשבון אצלנו. עוברים להתחברות.'

const registerSchema = z.object({
  name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים').max(50),
  age: z
    .string()
    .regex(/^\d+$/, 'גיל לא תקין')
    .refine((v) => {
      const n = parseInt(v, 10)
      return n >= 16 && n <= 100
    }, 'גיל חייב להיות בין 16 ל-100'),
  email: z.string().min(1, 'נדרש אימייל').email('אימייל לא תקין').max(254),
  phone: z
    .string()
    .min(10, 'מספר לא חוקי')
    .regex(/^(\+972|0)?[5][0-9]{8}$/, 'מספר לא חוקי. תן מספר ישראלי.'),
})

type RegisterFormData = z.infer<typeof registerSchema>

type FocusedField = 'name' | 'age' | 'email' | 'phone' | null

export default function RegisterScreen() {
  const router = useRouter()
  const { height } = useWindowDimensions()
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<FocusedField>(null)

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', age: '', email: '', phone: '' },
  })

  const handleRegister = async (data: RegisterFormData) => {
    setLoading(true)
    try {
      let phone: string = data.phone.replace(/\s/g, '')
      if (phone.startsWith('0')) phone = '+972' + phone.slice(1)
      else if (!phone.startsWith('+972')) phone = '+972' + phone

      const checkRes = await fetch(`${SERVER_URL}/api/auth/check-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          email: data.email.trim().toLowerCase(),
        }),
      })
      const checkJson = await checkRes.json().catch(() => ({}))
      if (!checkRes.ok) {
        Toast.show({
          type: 'error',
          text1: formatApiErrorJson(checkJson, checkRes.status),
          position: 'bottom',
          visibilityTime: 5000,
        })
        return
      }
      const precheck = checkJson as { ok?: boolean; message?: string; code?: string }
      if (precheck.ok === false) {
        Toast.show({
          type: 'error',
          text1: precheck.message ?? 'לא ניתן להמשיך בהרשמה',
          position: 'bottom',
          visibilityTime: 5500,
        })
        return
      }

      if (precheck.code === 'PHONE_EXISTS') {
        Toast.show({
          type: 'info',
          text1: MSG_PHONE_ALREADY_REGISTERED,
          position: 'bottom',
          visibilityTime: 4500,
        })
        router.replace('/auth/login')
        return
      }

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
        router.push({
          pathname: '/auth/verify',
          params: {
            phone,
            name: data.name,
            age: data.age,
            email: data.email.trim().toLowerCase(),
            isRegister: '1',
          },
        })
      }
    } catch {
      Toast.show({ type: 'error', text1: 'בעיה בחיבור. בדוק את הרשת.', position: 'bottom', visibilityTime: 3000 })
    } finally {
      setLoading(false)
    }
  }

  const showValidationError = () => {
    const firstError =
      errors.name?.message ??
      errors.age?.message ??
      errors.email?.message ??
      errors.phone?.message
    if (firstError) {
      Toast.show({ type: 'error', text1: firstError, position: 'bottom', visibilityTime: 3000 })
    }
  }

  const bottomBorder = (field: 'name' | 'age' | 'email' | 'phone', hasError: boolean) => {
    if (hasError) return '#ff716c'
    if (focused === field) return PRIMARY
    return OUTLINE_VARIANT
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AuthScreenBackdrop />

      <ScrollView
        contentContainerStyle={[styles.scroll, { minHeight: height * 0.88 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centerColumn}>
          {/* כותרת מעל הכרטיס */}
          <View style={styles.hero}>
            <View style={styles.iconCard}>
              <MaterialIcons name="person-add" size={30} color={PRIMARY} />
            </View>
            <Text style={styles.title}>נעים להכיר! בוא נתחיל</Text>
            <Text style={styles.subtitle}>הצעד הראשון שלך למסע חדש מתחיל כאן</Text>
          </View>

          {/* כרטיס טופס */}
          <View style={styles.formCard}>
            <View style={styles.formInner}>
              {/* שם */}
              <View style={styles.fieldBlock}>
                <Text style={styles.label} nativeID="label-name">
                  שם מלא
                </Text>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { value, onChange } }) => (
                    <View
                      style={[
                        styles.inputShell,
                        { borderBottomColor: bottomBorder('name', !!errors.name) },
                      ]}
                    >
                      <TextInput
                        style={styles.input}
                        placeholder="ישראל ישראלי"
                        placeholderTextColor={PLACEHOLDER}
                        value={value}
                        onChangeText={onChange}
                        autoCapitalize="words"
                        textAlign="right"
                        editable={!loading}
                        onFocus={() => setFocused('name')}
                        onBlur={() => setFocused((f) => (f === 'name' ? null : f))}
                        accessibilityLabelledBy="label-name"
                      />
                    </View>
                  )}
                />
              </View>

              {/* גיל */}
              <View style={styles.fieldBlock}>
                <Text style={styles.label} nativeID="label-age">
                  גיל
                </Text>
                <Controller
                  control={control}
                  name="age"
                  render={({ field: { value, onChange } }) => (
                    <View
                      style={[
                        styles.inputShell,
                        { borderBottomColor: bottomBorder('age', !!errors.age) },
                      ]}
                    >
                      <TextInput
                        style={styles.input}
                        placeholder="24"
                        placeholderTextColor={PLACEHOLDER}
                        value={value}
                        onChangeText={onChange}
                        keyboardType="number-pad"
                        maxLength={3}
                        textAlign="right"
                        editable={!loading}
                        onFocus={() => setFocused('age')}
                        onBlur={() => setFocused((f) => (f === 'age' ? null : f))}
                        accessibilityLabelledBy="label-age"
                      />
                    </View>
                  )}
                />
              </View>

              {/* אימייל — חובה בהרשמה בלבד; ההתחברות נשארת בטלפון */}
              <View style={styles.fieldBlock}>
                <Text style={styles.label} nativeID="label-email">
                  אימייל
                </Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { value, onChange } }) => (
                    <View
                      style={[
                        styles.inputShell,
                        { borderBottomColor: bottomBorder('email', !!errors.email) },
                      ]}
                    >
                      <TextInput
                        style={styles.input}
                        placeholder="כתובת אימייל"
                        placeholderTextColor={PLACEHOLDER}
                        value={value}
                        onChangeText={onChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        textAlign="right"
                        editable={!loading}
                        onFocus={() => setFocused('email')}
                        onBlur={() => setFocused((f) => (f === 'email' ? null : f))}
                        accessibilityLabelledBy="label-email"
                      />
                    </View>
                  )}
                />
              </View>

              {/* טלפון */}
              <View style={styles.fieldBlock}>
                <Text style={styles.label} nativeID="label-phone">
                  מספר טלפון
                </Text>
                <View style={styles.phoneRow}>
                  <View style={styles.prefixBox}>
                    <Text style={styles.prefixText}>+972</Text>
                  </View>
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field: { value, onChange } }) => (
                      <View
                        style={[
                          styles.phoneInputShell,
                          { borderBottomColor: bottomBorder('phone', !!errors.phone) },
                        ]}
                      >
                        <TextInput
                          style={styles.phoneInput}
                          placeholder="50 000 0000"
                          placeholderTextColor={PLACEHOLDER}
                          value={value}
                          onChangeText={onChange}
                          keyboardType="phone-pad"
                          textAlign="left"
                          editable={!loading}
                          onFocus={() => setFocused('phone')}
                          onBlur={() => setFocused((f) => (f === 'phone' ? null : f))}
                          accessibilityLabelledBy="label-phone"
                        />
                      </View>
                    )}
                  />
                </View>
              </View>

              {/* כפתור שליחה */}
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={handleSubmit(handleRegister, showValidationError)}
                disabled={loading}
                style={styles.ctaOuter}
              >
                <LinearGradient
                  colors={[PRIMARY_DIM, PRIMARY]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ctaGradient}
                >
                  <Text style={styles.ctaText}>{loading ? 'שולח...' : 'יאללה, בוא נצא לדרך'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerCol}>
            <Text style={styles.footerMuted}>כבר יש לך חשבון?</Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')} hitSlop={8} accessibilityRole="link">
              <Text style={styles.footerLink}>התחבר כאן</Text>
            </TouchableOpacity>
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
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  centerColumn: {
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCard: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: SURFACE_CONTAINER_HIGH,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: ON_SURFACE,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.8,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    color: ON_SURFACE_VARIANT,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  formCard: {
    backgroundColor: SURFACE_CONTAINER_LOW,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.45,
        shadowRadius: 24,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  formInner: {
    padding: 32,
    gap: 32,
  },
  fieldBlock: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: ON_SURFACE_VARIANT,
    textAlign: 'right',
    marginEnd: 4,
    fontFamily: 'Inter',
  },
  inputShell: {
    backgroundColor: SURFACE_CONTAINER_HIGH,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 2,
    borderBottomColor: OUTLINE_VARIANT,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    fontSize: 18,
    color: ON_SURFACE,
    fontFamily: 'Inter',
    padding: 0,
    margin: 0,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  phoneInputShell: {
    flex: 1,
    backgroundColor: SURFACE_CONTAINER_HIGH,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 2,
    borderBottomColor: OUTLINE_VARIANT,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  phoneInput: {
    fontSize: 18,
    color: ON_SURFACE,
    fontFamily: 'Inter',
    padding: 0,
    margin: 0,
    writingDirection: 'ltr',
  },
  prefixBox: {
    backgroundColor: SURFACE_CONTAINER_HIGH,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
  },
  prefixText: {
    color: PRIMARY,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  ctaOuter: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  ctaGradient: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  ctaText: {
    fontSize: 20,
    fontWeight: '900',
    color: ON_PRIMARY_FIXED,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  footerCol: {
    alignItems: 'center',
    marginTop: 32,
    gap: 8,
  },
  footerMuted: {
    fontSize: 14,
    color: ON_SURFACE_VARIANT,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  footerLink: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: '700',
    fontFamily: 'Inter',
    textDecorationLine: 'underline',
  },
})
