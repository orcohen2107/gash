import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Toast from 'react-native-toast-message'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'

const registerSchema = z.object({
  name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים').max(50),
  age: z
    .string()
    .regex(/^\d+$/, 'גיל לא תקין')
    .refine((v) => {
      const n = parseInt(v, 10)
      return n >= 16 && n <= 100
    }, 'גיל חייב להיות בין 16 ל-100'),
  phone: z
    .string()
    .min(10, 'מספר לא חוקי')
    .regex(/^(\+972|0)?[5][0-9]{8}$/, 'מספר לא חוקי. תן מספר ישראלי.'),
})

type RegisterFormData = z.infer<typeof registerSchema>

interface FieldLabelProps {
  label: string
}

function FieldLabel({ label }: FieldLabelProps) {
  return <Text style={styles.label}>{label}</Text>
}

export default function RegisterScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', age: '', phone: '' },
  })

  const handleRegister = async (data: RegisterFormData) => {
    setLoading(true)
    try {
      let phone = data.phone.replace(/\s/g, '')
      if (phone.startsWith('0')) phone = '+972' + phone.slice(1)
      else if (!phone.startsWith('+972')) phone = '+972' + phone

      const { error } = await supabase.auth.signInWithOtp({ phone })

      if (error) {
        Toast.show({
          type: 'error',
          text1: error.message.includes('phone') ? 'מספר לא חוקי.' : 'בעיה בחיבור. בדוק את הרשת.',
          position: 'bottom',
          visibilityTime: 3000,
        })
      } else {
        router.push({
          pathname: '/auth/verify',
          params: {
            phone,
            name: data.name,
            age: data.age,
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
    const firstError = errors.name?.message ?? errors.age?.message ?? errors.phone?.message
    if (firstError) {
      Toast.show({ type: 'error', text1: firstError, position: 'bottom', visibilityTime: 3000 })
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>👤+</Text>
          </View>

          <Text style={styles.title}>נעים להכיר! בוא נתחיל</Text>
          <Text style={styles.subtitle}>הצעד הראשון שלך למסע חדש מתחיל כאן</Text>

          <View style={styles.form}>
            {/* Name */}
            <View style={styles.fieldGroup}>
              <FieldLabel label="שם מלא" />
              <Controller
                control={control}
                name="name"
                render={({ field: { value, onChange } }) => (
                  <View style={[styles.inputBox, errors.name && styles.inputBoxError]}>
                    <TextInput
                      style={styles.input}
                      placeholder="ישראל ישראלי"
                      placeholderTextColor="#555"
                      value={value}
                      onChangeText={onChange}
                      autoCapitalize="words"
                      textAlign="right"
                    />
                  </View>
                )}
              />
            </View>

            {/* Age */}
            <View style={styles.fieldGroup}>
              <FieldLabel label="גיל" />
              <Controller
                control={control}
                name="age"
                render={({ field: { value, onChange } }) => (
                  <View style={[styles.inputBox, errors.age && styles.inputBoxError]}>
                    <TextInput
                      style={styles.input}
                      placeholder="24"
                      placeholderTextColor="#555"
                      value={value}
                      onChangeText={onChange}
                      keyboardType="number-pad"
                      maxLength={3}
                      textAlign="right"
                    />
                  </View>
                )}
              />
            </View>

            {/* Phone */}
            <View style={styles.fieldGroup}>
              <FieldLabel label="מספר טלפון" />
              <View style={styles.phoneRow}>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { value, onChange } }) => (
                    <View style={[styles.inputBox, styles.phoneInput, errors.phone && styles.inputBoxError]}>
                      <TextInput
                        style={styles.input}
                        placeholder="50 000 0000"
                        placeholderTextColor="#555"
                        value={value}
                        onChangeText={onChange}
                        keyboardType="phone-pad"
                        textAlign="right"
                      />
                    </View>
                  )}
                />
                <View style={styles.prefixBox}>
                  <Text style={styles.prefixText}>+972</Text>
                </View>
              </View>
            </View>
          </View>

          <Button
            title={loading ? 'שולח...' : 'יאללה, בוא נצא לדרך'}
            onPress={handleSubmit(handleRegister, showValidationError)}
            disabled={loading}
            loading={loading}
            style={styles.button}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>כבר יש לך חשבון? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.switchLink}>התחבר כאן</Text>
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
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#1c1c1c',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: { fontSize: 28 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#adaaaa',
    textAlign: 'center',
    fontFamily: 'Inter',
    marginBottom: 32,
    lineHeight: 21,
  },
  form: { width: '100%', gap: 16, marginBottom: 28 },
  fieldGroup: { width: '100%', gap: 6 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cccccc',
    fontFamily: 'Inter',
    textAlign: 'right',
  },
  inputBox: {
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2e2e2e',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputBoxError: {
    borderColor: '#ff6b6b',
  },
  input: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  phoneInput: { flex: 1 },
  prefixBox: {
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2e2e2e',
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefixText: {
    color: '#81ecff',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  button: { width: '100%', marginBottom: 24 },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  switchLabel: { fontSize: 13, color: '#adaaaa', fontFamily: 'Inter' },
  switchLink: {
    fontSize: 13,
    color: '#81ecff',
    fontFamily: 'Inter',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
})
