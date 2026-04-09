import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, SafeAreaView, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Toast from 'react-native-toast-message'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

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

  const { control, handleSubmit } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  })

  const showValidationToast = () => {
    Toast.show({
      type: 'error',
      text1: 'מספר לא חוקי. תן מספר ישראלי.',
      position: 'bottom',
      autoHide: true,
      visibilityTime: 3000,
    })
  }

  const handlePhoneSubmit = async (data: PhoneFormData) => {
    setLoading(true)

    try {
      let normalizedPhone = data.phone.replace(/\s/g, '')
      if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '+972' + normalizedPhone.slice(1)
      } else if (!normalizedPhone.startsWith('+972')) {
        normalizedPhone = '+972' + normalizedPhone
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
      })

      if (error) {
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
        router.push({
          pathname: '/auth/verify',
          params: { phone: normalizedPhone },
        })
      }
    } catch {
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
          <Text style={styles.title}>כניסה חדשה</Text>

          <Text style={styles.subtitle}>הכנס את מספר הטלפון שלך כדי להתחיל</Text>

          <View style={styles.formSection}>
            <Controller
              control={control}
              name="phone"
              render={({ field: { value, onChange } }) => (
                <Input
                  placeholder="+972 50 123 4567"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                />
              )}
            />
          </View>

          <View style={styles.buttonSection}>
            <Button
              title={loading ? 'שליחה...' : 'שלח קוד'}
              onPress={handleSubmit(handlePhoneSubmit, showValidationToast)}
              disabled={loading}
              loading={loading}
            />
          </View>

          <Text style={styles.helpText}>אנחנו נשלח קוד אימות ל-SMS שלך</Text>
        </View>
      </ScrollView>

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
  helpText: {
    fontSize: 12,
    color: '#adaaaa',
    textAlign: 'center',
    fontFamily: 'Inter',
    lineHeight: 18,
  },
})
