import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View, Modal, ScrollView } from 'react-native'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import DateTimePicker from '@react-native-community/datetimepicker'
import Slider from '@react-native-community/slider'
import { BottomSheetView, useBottomSheetModal } from '@gorhom/bottom-sheet'
import Toast from 'react-native-toast-message'
import { z } from 'zod'
import { CreateApproachSchema } from '@gash/schemas'
import { useLogStore } from '@/stores/useLogStore'
import { analytics } from '@/lib/analytics'

interface LogBottomSheetProps {
  onDismiss?: () => void
}

const APPROACH_TYPES = [
  { label: 'בחר סוג', value: '' },
  { label: 'ישיר', value: 'direct' },
  { label: 'סיטואטיבי', value: 'situational' },
  { label: 'הומור', value: 'humor' },
  { label: 'אונליין', value: 'online' },
]

const OPENERS_BY_TYPE: Record<string, Array<{ label: string; value: string }>> = {
  direct: [
    { label: 'היי, מה שלום?', value: 'היי, מה שלום?' },
    { label: 'הנראה שהיה לי ריג\'ה', value: 'הנראה שהיה לי ריג\'ה עם הפנים שלך' },
    { label: 'אני חושב שאת מעניינת', value: 'אני חושב שאת מעניינת' },
    { label: 'בואי אוכל לקבל מספר שלך?', value: 'בואי אוכל לקבל מספר שלך?' },
  ],
  situational: [
    { label: 'מה את עושה כאן?', value: 'מה את עושה כאן בלבד?' },
    { label: 'את הולכת לאן?', value: 'את הולכת לאן?' },
    { label: 'בואי כרצים', value: 'בואי כרצים' },
  ],
  humor: [
    { label: 'מחשבתי שיש לך קצת יותר טוב', value: 'מחשבתי שיש לך קצת יותר טוב מאז...' },
    { label: 'אתה לא צריך עזרה', value: 'אתה לא צריך עזרה עם המשקל שלך?' },
  ],
  online: [
    { label: 'אני אוהב את הקונטנט שלך', value: 'אני אוהב את הקונטנט שלך' },
    { label: 'אתה נראה שאתה צוחק', value: 'אתה נראה שאתה צוחק בתמונה הזאת' },
  ],
}

const RESPONSES = [
  { label: 'בחר תגובה', value: '' },
  { label: 'חיובית', value: 'positive' },
  { label: 'ניטרלית', value: 'neutral' },
  { label: 'שלילית', value: 'dismissive' },
]

const FOLLOW_UPS = [
  { label: 'בחר המשך', value: '' },
  { label: 'מפגש', value: 'meeting' },
  { label: 'הודעה', value: 'text' },
  { label: 'אינסטגרם', value: 'instagram' },
  { label: 'לא היה', value: 'nothing' },
]

function DropdownField({
  value,
  onChange,
  options,
  label,
}: {
  value: string | null
  onChange: (value: string) => void
  options: Array<{ label: string; value: string }>
  label: string
}) {
  const [showDropdown, setShowDropdown] = useState(false)
  const selectedLabel = options.find((o) => o.value === value)?.label || label

  return (
    <View>
      <Pressable
        style={styles.dropdownButton}
        onPress={() => setShowDropdown(true)}
      >
        <Text style={styles.dropdownButtonText}>{selectedLabel}</Text>
      </Pressable>

      <Modal visible={showDropdown} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowDropdown(false)}>
          <View style={styles.dropdownMenu}>
            <ScrollView>
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onChange(option.value)
                    setShowDropdown(false)
                  }}
                  style={styles.dropdownMenuItem}
                >
                  <Text style={[styles.dropdownMenuItemText, value === option.value && styles.dropdownMenuItemSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

export function LogBottomSheet({}: LogBottomSheetProps) {
  const { dismiss } = useBottomSheetModal()
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(CreateApproachSchema),
    mode: 'onChange',
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      location: '',
      approach_type: 'direct' as const,
      opener: '',
      response: 'positive' as const,
      chemistry_score: 5,
      follow_up: 'nothing' as const,
      notes: '',
    },
  })

  const approachType = watch('approach_type')
  const openers = OPENERS_BY_TYPE[approachType] || []

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false)
    if (date) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Don't allow future dates
      if (date > today) {
        Toast.show({
          type: 'error',
          text1: 'תאריך לא תקין',
          text2: 'לא ניתן לבחור תאריכים עתידיים',
        })
        return
      }

      setSelectedDate(date)
      // Update form value through onChange
    }
  }

  const onFormSubmit = async (data: any) => {
    const { addApproach } = useLogStore()
    await addApproach(data)
    // Track approach logged
    analytics.trackApproachLogged(data.approach_type, data.chemistry_score, data.follow_up)
    dismiss()
  }

  return (
    <BottomSheetView style={styles.container}>
      <Text style={styles.title}>רשום גישה</Text>

      <View style={styles.form}>
        {/* Date Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>תאריך</Text>
          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <View>
                <Pressable
                  style={[styles.dateButton, errors.date && styles.fieldError]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {selectedDate.toLocaleDateString('he-IL')}
                  </Text>
                </Pressable>
                {errors.date && <Text style={styles.errorText}>{errors.date.message as string}</Text>}
              </View>
            )}
          />
        </View>

        {showDatePicker && (
          <DateTimePicker value={selectedDate} mode="date" display="spinner" onChange={handleDateChange} />
        )}

        {/* Location Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>מיקום</Text>
          <Controller
            control={control}
            name="location"
            render={({ field }) => (
              <View>
                <TextInput
                  placeholder="תל אביב, חיפה, וכו'"
                  placeholderTextColor="#adaaaa"
                  style={[styles.input, errors.location && styles.inputError]}
                  textAlign="right"
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                />
                {errors.location && <Text style={styles.errorText}>{errors.location.message as string}</Text>}
              </View>
            )}
          />
        </View>

        {/* Approach Type Dropdown */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>סוג גישה</Text>
          <Controller
            control={control}
            name="approach_type"
            render={({ field }) => (
              <View>
                <DropdownField
                  value={field.value}
                  onChange={field.onChange}
                  options={APPROACH_TYPES.filter((o) => o.value !== '')}
                  label="בחר סוג"
                />
                {errors.approach_type && <Text style={styles.errorText}>{errors.approach_type.message as string}</Text>}
              </View>
            )}
          />
        </View>

        {/* Opener Dropdown (depends on approach_type) */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>פתיחה</Text>
            <Text style={styles.charCount}>{(watch('opener') ?? '').length}/200</Text>
          </View>
          <Controller
            control={control}
            name="opener"
            render={({ field }) => (
              <View>
                <DropdownField
                  value={field.value}
                  onChange={field.onChange}
                  options={openers}
                  label="בחר פתיחה"
                />
                {errors.opener && <Text style={styles.errorText}>{errors.opener.message as string}</Text>}
              </View>
            )}
          />
        </View>

        {/* Response Dropdown */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>תגובה</Text>
          <Controller
            control={control}
            name="response"
            render={({ field }) => (
              <View>
                <DropdownField
                  value={field.value}
                  onChange={field.onChange}
                  options={RESPONSES.filter((o) => o.value !== '')}
                  label="בחר תגובה"
                />
                {errors.response && <Text style={styles.errorText}>{errors.response.message as string}</Text>}
              </View>
            )}
          />
        </View>

        {/* Chemistry Slider */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>כימיה</Text>
          <Controller
            control={control}
            name="chemistry_score"
            render={({ field }) => (
              <View>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={field.value ?? 5}
                  onValueChange={(value: number | number[]) => {
                    const numValue = Array.isArray(value) ? value[0] : value
                    field.onChange(Math.round(numValue))
                  }}
                  minimumTrackTintColor="#81ecff"
                  maximumTrackTintColor="#20201f"
                  thumbTintColor="#81ecff"
                />
                <Text style={styles.sliderValue}>{field.value ?? 5}</Text>
              </View>
            )}
          />
        </View>

        {/* Follow-up Dropdown */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>המשך</Text>
          <Controller
            control={control}
            name="follow_up"
            render={({ field }) => (
              <View>
                <DropdownField
                  value={field.value}
                  onChange={field.onChange}
                  options={FOLLOW_UPS.filter((o) => o.value !== '')}
                  label="בחר המשך"
                />
                {errors.follow_up && <Text style={styles.errorText}>{errors.follow_up.message as string}</Text>}
              </View>
            )}
          />
        </View>

        {/* Notes Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>הערות</Text>
          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <TextInput
                placeholder="הערות כלליות על הגישה"
                placeholderTextColor="#adaaaa"
                style={[styles.input, styles.notesInput]}
                textAlign="right"
                multiline
                numberOfLines={3}
                value={field.value ?? ''}
                onChangeText={field.onChange}
              />
            )}
          />
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.button, !isValid && styles.buttonDisabled]}
          onPress={handleSubmit(onFormSubmit)}
          disabled={!isValid}
        >
          <Text style={styles.buttonText}>שמור</Text>
        </Pressable>
      </View>
    </BottomSheetView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0e0e0e',
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    gap: 20,
  },
  fieldContainer: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#adaaaa',
    textAlign: 'right',
  },
  charCount: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'left',
  },
  input: {
    backgroundColor: '#20201f',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    borderRadius: 4,
    fontSize: 16,
  },
  inputError: {
    borderBottomColor: '#ff6b6b',
  },
  dropdownButton: {
    backgroundColor: '#20201f',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
  },
  dropdownButtonText: {
    color: '#ffffff',
    textAlign: 'right',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dropdownMenu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#20201f',
    maxHeight: 300,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  dropdownMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  dropdownMenuItemText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'right',
  },
  dropdownMenuItemSelected: {
    color: '#81ecff',
    fontWeight: '600',
  },
  slider: {
    height: 40,
    marginVertical: 8,
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#81ecff',
    textAlign: 'center',
  },
  notesInput: {
    minHeight: 60,
    paddingTop: 10,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    textAlign: 'right',
  },
  dateButton: {
    backgroundColor: '#20201f',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  dateButtonText: {
    color: '#ffffff',
    textAlign: 'right',
    fontSize: 16,
  },
  fieldError: {
    borderBottomColor: '#ff6b6b',
  },
  footer: {
    marginTop: 24,
    gap: 12,
  },
  button: {
    backgroundColor: '#81ecff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
})
