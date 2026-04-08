import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native'
import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Toast from 'react-native-toast-message'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Text } from 'react-native'

// Zod schema for Israeli phone validation
const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, 'מספר לא חוקי')
    .regex(
      /^(\+972|0)?[5][0-9]{8}$/,
      'מספר לא חוקי. תן מספר ישראלי.'
    ),
})

type PhoneFormData = z.infer<typeof phoneSchema>

export default function PhoneAuthScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { control, handleSubmit, watch } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  })

  const handlePhoneSubmit = async (data: PhoneFormData) => {
    setLoading(true)

    try {
      // Normalize phone number: if starts with 0, replace with +972
      let normalizedPhone = data.phone.replace(/\s/g, '')
      if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '+972' + normalizedPhone.slice(1)
      } else if (!normalizedPhone.startsWith('+972')) {
        normalizedPhone = '+972' + normalizedPhone
      }

      // Call Supabase Auth signInWithOtp
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
      })

      if (error) {
        // Network or validation error
        const message = error.message.includes('phone')
          ? 'מספר לא חוקי. תן מספר ישראלי.'
          : 'בעיה בחיבור. בדוק את הרשת.'

        Toast.show({
          type: 'error',
          text1: message,
          position: 'bottom',
          autoHide: true,
          visibilityTime: 3000,
        })
      } else {
        // Success: navigate to verify screen with phone number in params
        router.push({
          pathname: '/auth/verify',
          params: { phone: normalizedPhone },
        })
      }
    } catch (err) {
      console.error('Phone auth error:', err)
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

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Title */}
          <Text style={styles.title}>כניסה חדשה</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>הכנס את מספר הטלפון שלך כדי להתחיל</Text>

          {/* Phone Input Field */}
          <View style={styles.formSection}>
            <Controller
              control={control}
              name="phone"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <>
                  <Input
                    placeholder="+972 50 123 4567"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                  />
                  {error && (
                    <Text style={styles.errorText}>{error.message}</Text>
                  )}
                </>
              )}
            />
          </View>

          {/* Submit Button */}
          <View style={styles.buttonSection}>
            <Button
              title={loading ? 'שליחה...' : 'שלח קוד'}
              onPress={handleSubmit(handlePhoneSubmit)}
              disabled={loading}
              loading={loading}
            />
          </View>

          {/* Help Text */}
          <Text style={styles.helpText}>
            אנחנו נשלח קוד אימות ל-SMS שלך
          </Text>
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
    fontSize: 16,
    color: '#adaaaa',
    marginBottom: 32,
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 24,
  },
  formSection: {
    width: '100%',
    marginBottom: 24,
  },
  buttonSection: {
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
  },
})
