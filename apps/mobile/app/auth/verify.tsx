import React, { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, ScrollView, SafeAreaView, Text, TouchableOpacity } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Toast from 'react-native-toast-message'
import { supabase } from '@/lib/supabase'
import { SERVER_URL, getAuthHeaders } from '@/lib/server'
import Input from '@/components/ui/Input'

const otpSchema = z.object({
  otp: z.string().regex(/^\d{4,6}$/, 'קוד לא חוקי. בדוק שוב.'),
})

type OtpFormData = z.infer<typeof otpSchema>

const TOAST_DURATION_MS = 3000

function showErrorToast(message: string) {
  Toast.show({ type: 'error', text1: message, position: 'bottom', autoHide: true, visibilityTime: TOAST_DURATION_MS })
}

export default function VerifyScreen() {
  const router = useRouter()
  const { phone, name, age, isRegister } = useLocalSearchParams<{
    phone: string
    name?: string
    age?: string
    isRegister?: string
  }>()

  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const { control, watch, setValue } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  })

  const otpValue = watch('otp')

  const saveProfile = useCallback(async () => {
    if (!name || !age) return
    try {
      const headers = await getAuthHeaders()
      await fetch(`${SERVER_URL}/api/user/profile`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, age: parseInt(age, 10) }),
      })
    } catch {
      // Non-blocking — user can still proceed. Profile can be saved later.
    }
  }, [name, age])

  const submitOtp = useCallback(
    async (otp: string) => {
      if (!phone) {
        showErrorToast('שגיאה: לא קיבלנו מספר טלפון')
        return
      }

      setLoading(true)
      try {
        // Dev bypass — מספר בדיקה + קוד קבוע
        if (phone === '+972504322800' && otp === '123456') {
          await supabase.auth.signInWithOtp({ phone })
          const { error, data: session } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
          if (error) {
            showErrorToast('Dev bypass נכשל — הגדר Supabase test phone')
            setValue('otp', '')
            return
          }
          if (session) router.replace('/(tabs)/coach')
          return
        }

        const { error, data: session } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })

        if (error) {
          showErrorToast(error.message.includes('Invalid') ? 'קוד לא נכון. בדוק שוב.' : 'בעיה בחיבור. בדוק את הרשת.')
          setValue('otp', '')
        } else if (session) {
          // After registration — save name + age to server
          if (isRegister === '1') {
            await saveProfile()
          }
          router.replace('/(tabs)/coach')
        }
      } catch {
        showErrorToast('בעיה בחיבור. בדוק את הרשת.')
      } finally {
        setLoading(false)
      }
    },
    [phone, router, setValue, isRegister, saveProfile]
  )

  useEffect(() => {
    if (/^\d{4,6}$/.test(otpValue)) {
      submitOtp(otpValue)
    }
  }, [otpValue, submitOtp])

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
        setValue('otp', '')
      }
    } catch {
      showErrorToast('בעיה בחיבור. בדוק את הרשת.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <Text style={styles.title}>אימות קוד</Text>
          <Text style={styles.subtitle}>
            {isRegister === '1' && name ? `היי ${name}! ` : ''}נשלח קוד אל {phone}
          </Text>

          <View style={styles.form}>
            <Controller
              control={control}
              name="otp"
              render={({ field: { value, onChange } }) => (
                <Input
                  placeholder="0000"
                  value={value}
                  onChangeText={(text) => onChange(text.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="numeric"
                  maxLength={6}
                  autoFocus
                  editable={!loading}
                />
              )}
            />
          </View>

          <Text style={styles.helpText}>קוד האימות הוא 4-6 ספרות</Text>

          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>לא קיבלת קוד? </Text>
            <TouchableOpacity onPress={handleResend} disabled={resendLoading || loading}>
              <Text style={styles.resendLink}>{resendLoading ? 'שולח...' : 'שלח שוב'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0e0e0e' },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  container: { paddingHorizontal: 24, paddingVertical: 40, alignItems: 'center' },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#adaaaa',
    marginBottom: 32,
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 21,
  },
  form: { width: '100%', marginBottom: 24 },
  helpText: { fontSize: 12, color: '#adaaaa', textAlign: 'center', fontFamily: 'Inter', marginBottom: 32 },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  resendLabel: { fontSize: 12, color: '#adaaaa', fontFamily: 'Inter' },
  resendLink: { fontSize: 12, color: '#81ecff', fontFamily: 'Inter', fontWeight: '600', textDecorationLine: 'underline' },
})
