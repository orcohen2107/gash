import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, SafeAreaView, Text, TouchableOpacity } from 'react-native'
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
    .regex(/^(\+972|0)?[5][0-9]{8}$/, 'מספר לא חוקי. תן מספר ישראלי.'),
})

type PhoneFormData = z.infer<typeof phoneSchema>

export default function LoginScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { control, handleSubmit } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  })

  const handlePhoneSubmit = async (data: PhoneFormData) => {
    setLoading(true)
    try {
      let phone = data.phone.replace(/[\s-]/g, '')
      if (phone.startsWith('0')) phone = '+972' + phone.slice(1)
      else if (!phone.startsWith('+972')) phone = '+972' + phone

      // Dev bypass — מספר בדיקה, ללא SMS
      if (phone === '+972504322800') {
        router.push({ pathname: '/auth/verify', params: { phone } })
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
        router.push({ pathname: '/auth/verify', params: { phone } })
      }
    } catch {
      Toast.show({ type: 'error', text1: 'בעיה בחיבור. בדוק את הרשת.', position: 'bottom', visibilityTime: 3000 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <Text style={styles.title}>התחברות</Text>
          <Text style={styles.subtitle}>הכנס את מספר הטלפון שלך</Text>

          <View style={styles.form}>
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

          <Button
            title={loading ? 'שליחה...' : 'שלח קוד'}
            onPress={handleSubmit(handlePhoneSubmit)}
            disabled={loading}
            loading={loading}
            style={styles.button}
          />

          <Text style={styles.helpText}>נשלח לך קוד אימות ב-SMS</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>אין לך חשבון? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.switchLink}>הירשם כאן</Text>
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
    fontSize: 16,
    color: '#adaaaa',
    marginBottom: 32,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  form: { width: '100%', marginBottom: 24 },
  button: { width: '100%', marginBottom: 16 },
  helpText: { fontSize: 12, color: '#adaaaa', textAlign: 'center', fontFamily: 'Inter', marginBottom: 32 },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  switchLabel: { fontSize: 13, color: '#adaaaa', fontFamily: 'Inter' },
  switchLink: { fontSize: 13, color: '#81ecff', fontFamily: 'Inter', fontWeight: '600', textDecorationLine: 'underline' },
})
