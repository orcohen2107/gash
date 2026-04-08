import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, SafeAreaView, Text, TouchableOpacity } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Toast from 'react-native-toast-message'
import { supabase } from '@/lib/supabase'
import Input from '@/components/ui/Input'

// Zod schema for OTP validation (4-6 digits)
const otpSchema = z.object({
  otp: z
    .string()
    .regex(/^\d{4,6}$/, 'קוד לא חוקי. בדוק שוב.'),
})

type OtpFormData = z.infer<typeof otpSchema>

export default function VerifyScreen() {
  const router = useRouter()
  const { phone } = useLocalSearchParams<{ phone: string }>()
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const { control, handleSubmit, watch, setValue } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  })

  const otpValue = watch('otp')

  // Auto-submit when OTP is fully entered
  useEffect(() => {
    if (otpValue && otpValue.length >= 4) {
      // Check if it's a valid complete OTP (4-6 digits)
      if (/^\d{4,6}$/.test(otpValue)) {
        handleSubmit(handleOtpSubmit)()
      }
    }
  }, [otpValue])

  const handleOtpSubmit = async (data: OtpFormData) => {
    if (!phone) {
      Toast.show({
        type: 'error',
        text1: 'שגיאה: לא קיבלנו מספר טלפון',
        position: 'bottom',
        autoHide: true,
        visibilityTime: 3000,
      })
      return
    }

    setLoading(true)

    try {
      // Call Supabase Auth verifyOtp
      const { error, data: session } = await supabase.auth.verifyOtp({
        phone,
        token: data.otp,
        type: 'sms',
      })

      if (error) {
        // Invalid OTP or network error
        const message = error.message.includes('Invalid')
          ? 'קוד לא נכון. בדוק שוב.'
          : 'בעיה בחיבור. בדוק את הרשת.'

        Toast.show({
          type: 'error',
          text1: message,
          position: 'bottom',
          autoHide: true,
          visibilityTime: 3000,
        })

        // Clear OTP field on error
        setValue('otp', '')
      } else if (session) {
        // Success: redirect to main app
        Toast.show({
          type: 'success',
          text1: 'כניסה בוצעה בהצלחה!',
          position: 'bottom',
          autoHide: true,
          visibilityTime: 2000,
        })

        // Navigate to main tabs after a brief delay
        setTimeout(() => {
          router.replace('/(tabs)/coach')
        }, 500)
      }
    } catch (err) {
      console.error('OTP verification error:', err)
      Toast.show({
        type: 'error',
        text1: 'בעיה בחיבור. בדוק את הרשת.',
        position: 'bottom',
        autoHide: true,
        visibilityTime: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!phone) {
      Toast.show({
        type: 'error',
        text1: 'שגיאה: לא קיבלנו מספר טלפון',
        position: 'bottom',
        autoHide: true,
        visibilityTime: 3000,
      })
      return
    }

    setResendLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      })

      if (error) {
        Toast.show({
          type: 'error',
          text1: 'בעיה בשליחה. בדוק את הרשת.',
          position: 'bottom',
          autoHide: true,
          visibilityTime: 3000,
        })
      } else {
        Toast.show({
          type: 'success',
          text1: 'קוד חדש נשלח!',
          position: 'bottom',
          autoHide: true,
          visibilityTime: 2000,
        })
        setValue('otp', '')
      }
    } catch (err) {
      console.error('Resend OTP error:', err)
      Toast.show({
        type: 'error',
        text1: 'בעיה בחיבור. בדוק את הרשת.',
        position: 'bottom',
        autoHide: true,
        visibilityTime: 3000,
      })
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Title */}
          <Text style={styles.title}>אימות קוד</Text>

          {/* Subtitle with phone display */}
          <Text style={styles.subtitle}>
            נשלחנו קוד אל {phone}
          </Text>

          {/* OTP Input Field */}
          <View style={styles.formSection}>
            <Controller
              control={control}
              name="otp"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <>
                  <Input
                    placeholder="0000"
                    value={value}
                    onChangeText={(text) => {
                      // Only allow digits
                      const digitsOnly = text.replace(/[^0-9]/g, '')
                      // Max 6 digits
                      onChange(digitsOnly.slice(0, 6))
                    }}
                    keyboardType="numeric"
                    maxLength={6}
                    autoFocus
                  />
                  {error && (
                    <Text style={styles.errorText}>{error.message}</Text>
                  )}
                </>
              )}
            />
          </View>

          {/* Help Text */}
          <Text style={styles.helpText}>
            קוד התאימות הוא 4-6 ספרות
          </Text>

          {/* Resend Link */}
          <View style={styles.resendSection}>
            <Text style={styles.resendLabel}>לא קיבלת קוד? </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={resendLoading}
            >
              <Text style={styles.resendLink}>
                {resendLoading ? 'שולח...' : 'שלח שוב'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Toast container for notifications */}
      <Toast />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0e0e0e',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
  },
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
  formSection: {
    width: '100%',
    marginBottom: 24,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 6,
    fontFamily: 'Inter',
    textAlign: 'right',
  },
  helpText: {
    fontSize: 12,
    color: '#adaaaa',
    textAlign: 'center',
    fontFamily: 'Inter',
    lineHeight: 18,
    marginBottom: 32,
  },
  resendSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  resendLabel: {
    fontSize: 12,
    color: '#adaaaa',
    fontFamily: 'Inter',
  },
  resendLink: {
    fontSize: 12,
    color: '#81ecff',
    fontFamily: 'Inter',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
})
