import React, { useEffect, useMemo, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import DateTimePicker from '@react-native-community/datetimepicker'
import Slider from '@react-native-community/slider'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { LinearGradient } from 'expo-linear-gradient'
import { useFonts, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans'
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import { MaterialIcons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'
import { CreateApproachSchema } from '@gash/schemas'
import { FOLLOW_UP_LABELS } from '@gash/constants'
import { z } from 'zod'
import type { ApproachType, FollowUpType } from '@gash/types'
import { useLogStore } from '@/stores/useLogStore'
import { analytics } from '@/lib/analytics'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { SpeechToTextButton } from '@/components/log/SpeechToTextButton'

interface LogBottomSheetProps {
  onClose: () => void
}

const C = {
  bg: '#0e0e0e',
  surfaceLow: '#131313',
  surfaceHigh: '#20201f',
  surfaceHighest: '#262626',
  onSurface: '#ffffff',
  onVariant: '#adaaaa',
  outline: '#767575',
  outlineVariant: '#484847',
  primary: '#81ecff',
  primaryDim: '#00d4ec',
  onPrimaryFixed: '#003840',
  tertiaryDim: '#929bfa',
  error: '#ff716c',
}

const APPROACH_CHIPS: { value: ApproachType; label: string }[] = [
  { value: 'direct', label: 'ישירה' },
  { value: 'situational', label: 'סיטואטיבי' },
  { value: 'humor', label: 'הומור' },
  { value: 'online', label: 'אונליין' },
]

/** סדר תצוגה: מימין לשמאל — הודעה קודם מימין אחרי פתיחת הרשימה */
const FOLLOW_UP_ORDER: FollowUpType[] = [
  'text',
  'instagram',
  'phone',
  'meeting',
  'instant',
  'coffee',
  'kiss',
  'went_home',
  'nothing',
]

const FOLLOW_UP_OPTIONS: { value: FollowUpType; label: string }[] = FOLLOW_UP_ORDER.map(
  (value) => ({ value, label: FOLLOW_UP_LABELS[value] })
)

const CHEMISTRY_HINT =
  'כימיה = כמה ניצוצות הרגשת ביניכם ברגע הפנייה (לא רק מראה חיצוני): 1–3 חלש, 4–6 נחמד, 7–8 חיבור טוב, 9–10 חשמל חזק.'

/** חיובית / ניטרלית / שלילית / התעלמות — ערכים תואמי סטטיסטיקות */
const RESPONSE_OPTIONS: {
  value: string
  label: string
  icon: React.ComponentProps<typeof MaterialIcons>['name']
  iconColor: string
}[] = [
  { value: 'positive', label: 'חיובית', icon: 'sentiment-very-satisfied', iconColor: C.tertiaryDim },
  { value: 'neutral', label: 'ניטרלית', icon: 'sentiment-neutral', iconColor: C.tertiaryDim },
  { value: 'dismissive', label: 'שלילית', icon: 'sentiment-very-dissatisfied', iconColor: C.error },
  { value: 'ignored', label: 'התעלמות', icon: 'block', iconColor: C.outline },
]

function formatDateHebrew(date: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const rest = date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })
  if (d.getTime() === today.getTime()) {
    return `היום, ${rest}`
  }
  return date.toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function SlabShell({
  focused,
  children,
  style,
}: {
  focused: boolean
  children: React.ReactNode
  style?: object
}) {
  return (
    <View style={[styles.slab, focused && styles.slabFocused, style]}>{children}</View>
  )
}

/** גובה משוער של פס «שמור» הצף + ריווח מינימלי מעל סרגל הטאבים */
function scrollBottomInset(bottomInset: number): number {
  const bar = 58
  return bar + Math.max(bottomInset, 4) + 8
}

export function LogBottomSheet({ onClose }: LogBottomSheetProps) {
  const insets = useSafeAreaInsets()
  const scrollPadBottom = scrollBottomInset(insets.bottom)
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  })
  const fontsReady = fontsLoaded === true

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [locFocus, setLocFocus] = useState(false)
  const [notesFocus, setNotesFocus] = useState(false)
  const [openerFocus, setOpenerFocus] = useState(false)
  const [followMenuOpen, setFollowMenuOpen] = useState(false)

  const defaultFormValues = useMemo(
    () => ({
      date: new Date().toISOString().split('T')[0],
      location: '',
      approach_type: 'direct' as const,
      opener: '',
      response: 'positive' as string,
      chemistry_score: 8,
      follow_up: 'nothing' as const,
      notes: '',
    }),
    []
  )

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<z.infer<typeof CreateApproachSchema>>({
    resolver: zodResolver(CreateApproachSchema),
    mode: 'onChange',
    defaultValues: defaultFormValues,
  })

  const pendingEditApproach = useLogStore((s) => s.pendingEditApproach)
  const setPendingEditApproach = useLogStore((s) => s.setPendingEditApproach)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    if (!pendingEditApproach) return
    const a = pendingEditApproach
    reset({
      date: a.date.slice(0, 10),
      location: a.location ?? '',
      approach_type: a.approach_type,
      opener: a.opener ?? '',
      response: a.response && a.response.length > 0 ? a.response : 'positive',
      chemistry_score: a.chemistry_score ?? 8,
      follow_up: a.follow_up ?? 'nothing',
      notes: a.notes ?? '',
    })
    setEditingId(a.id)
    setPendingEditApproach(null)
  }, [pendingEditApproach, reset, setPendingEditApproach])

  const watchedDate = watch('date')

  const selectedDate = useMemo(() => {
    if (!watchedDate) return new Date()
    const d = new Date(watchedDate + 'T12:00:00')
    return Number.isNaN(d.getTime()) ? new Date() : d
  }, [watchedDate])

  const handleClose = () => {
    setEditingId(null)
    reset(defaultFormValues)
    onClose()
  }

  const onFormSubmit = async (data: z.infer<typeof CreateApproachSchema>) => {
    if (editingId) {
      await useLogStore.getState().updateApproach(editingId, data)
    } else {
      await useLogStore.getState().addApproach(data)
      analytics.trackApproachLogged(
        data.approach_type,
        data.chemistry_score ?? 0,
        data.follow_up ?? undefined
      )
    }
    handleClose()
  }

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.loadingWrap} edges={['top', 'bottom']}>
        <ActivityIndicator color={C.primary} size="large" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.sheetRoot} edges={['top']}>
      <View style={styles.columnFill}>
      <View style={styles.header}>
        <Pressable
          onPress={handleClose}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.85 }]}
          accessibilityLabel="סגור"
        >
          <MaterialIcons name="close" size={22} color={C.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {editingId ? 'עריכת תיעוד גישה' : 'תיעוד גישה חדשה'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAwareScrollView
        style={styles.scrollFill}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: scrollPadBottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={120}
        enableAutomaticScroll
      >
        <View style={styles.grid2}>
          <View style={styles.gridCell}>
            <Text style={styles.fieldLabel}>תאריך</Text>
            <Controller
              control={control}
              name="date"
              render={({ field }) => {
                const onDatePick: (event: { type?: string } | null, date?: Date) => void = (
                  event,
                  date
                ) => {
                  if (Platform.OS === 'android') {
                    setShowDatePicker(false)
                  }
                  if (event?.type === 'dismissed' && Platform.OS === 'ios') {
                    setShowDatePicker(false)
                    return
                  }
                  if (!date) return
                  const today = new Date()
                  today.setHours(23, 59, 59, 999)
                  if (date > today) {
                    Toast.show({
                      type: 'error',
                      text1: 'תאריך לא תקין',
                      text2: 'לא ניתן לבחור תאריכים עתידיים',
                    })
                    return
                  }
                  field.onChange(date.toISOString().split('T')[0])
                }

                return (
                  <View>
                    <Pressable
                      onPress={() => {
                        setShowDatePicker(true)
                      }}
                    >
                      <SlabShell focused={showDatePicker}>
                        <View style={styles.slabRow}>
                          <MaterialIcons
                            name="calendar-today"
                            size={20}
                            color={C.primaryDim}
                            style={styles.slabStartIcon}
                          />
                          <Text
                            style={[styles.slabInputText, fontsReady && { fontFamily: 'Inter_600SemiBold' }]}
                          >
                            {formatDateHebrew(selectedDate)}
                          </Text>
                        </View>
                      </SlabShell>
                    </Pressable>
                    {Platform.OS === 'android' && showDatePicker ? (
                      <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="default"
                        onChange={onDatePick}
                      />
                    ) : null}
                    {Platform.OS === 'ios' ? (
                      <Modal
                        visible={showDatePicker}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setShowDatePicker(false)}
                      >
                        <View style={styles.dateModalRoot}>
                          <Pressable
                            style={styles.dateModalBackdrop}
                            onPress={() => setShowDatePicker(false)}
                            accessibilityLabel="סגור בחירת תאריך"
                          />
                          <View
                            style={[
                              styles.dateModalSheet,
                              { paddingBottom: Math.max(insets.bottom, 12) },
                            ]}
                          >
                            <View style={styles.dateModalToolbar}>
                              <Pressable
                                onPress={() => setShowDatePicker(false)}
                                hitSlop={12}
                                accessibilityLabel="סיום"
                              >
                                <Text style={styles.dateModalDone}>סיום</Text>
                              </Pressable>
                            </View>
                            <DateTimePicker
                              value={selectedDate}
                              mode="date"
                              display="spinner"
                              locale="he_IL"
                              themeVariant="dark"
                              onChange={onDatePick}
                            />
                          </View>
                        </View>
                      </Modal>
                    ) : null}
                    {errors.date ? (
                      <Text style={styles.errorText}>{String(errors.date.message)}</Text>
                    ) : null}
                  </View>
                )
              }}
            />
          </View>

          <View style={styles.gridCell}>
            <Text style={styles.fieldLabel}>מיקום</Text>
            <Controller
              control={control}
              name="location"
              render={({ field }) => (
                <View>
                  <SlabShell focused={locFocus}>
                    <View style={styles.slabRow}>
                      <MaterialIcons name="place" size={20} color={C.primaryDim} style={styles.slabStartIcon} />
                      <TextInput
                        placeholder="איפה זה קרה?"
                        placeholderTextColor={C.outline}
                        style={[styles.slabInputText, fontsReady && { fontFamily: 'Inter_600SemiBold' }]}
                        value={field.value ?? ''}
                        onChangeText={field.onChange}
                        onFocus={() => setLocFocus(true)}
                        onBlur={() => setLocFocus(false)}
                      />
                    </View>
                  </SlabShell>
                  {errors.location ? (
                    <Text style={styles.errorText}>{String(errors.location.message)}</Text>
                  ) : null}
                </View>
              )}
            />
          </View>
        </View>

        <View style={styles.typeOpenerRow}>
          <View style={styles.typeBlock}>
            <Text style={styles.fieldLabel}>סוג הגישה</Text>
            <Controller
              control={control}
              name="approach_type"
              render={({ field }) => (
                <View style={styles.chipBleed}>
                <View style={styles.chipWrap}>
                  {APPROACH_CHIPS.map((chip) => {
                    const active = field.value === chip.value
                    return (
                      <Pressable
                        key={chip.value}
                        onPress={() => {
                          field.onChange(chip.value)
                          setValue('opener', '', { shouldValidate: true })
                        }}
                        style={({ pressed }) => [
                          styles.chip,
                          active && styles.chipActive,
                          pressed && !active && { opacity: 0.9 },
                        ]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip.label}</Text>
                      </Pressable>
                    )
                  })}
                </View>
                </View>
              )}
            />
          </View>

          <View style={styles.openerBlock}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>מה אמרת בפועל?</Text>
              <Text style={styles.charCount}>{(watch('opener') ?? '').length}/200</Text>
            </View>
            <Controller
              control={control}
              name="opener"
              render={({ field }) => (
                <View>
                  <View style={styles.openerRow}>
                    <SlabShell focused={openerFocus} style={styles.openerSlab}>
                      <TextInput
                        placeholder="כתוב כאן את המשפט, או לחץ על המיקרופון"
                        placeholderTextColor={C.outline}
                        style={[styles.openerInput, fontsReady && { fontFamily: 'Inter_600SemiBold' }]}
                        multiline
                        value={field.value ?? ''}
                        onChangeText={field.onChange}
                        onFocus={() => setOpenerFocus(true)}
                        onBlur={() => setOpenerFocus(false)}
                        textAlign="right"
                        textAlignVertical="top"
                      />
                    </SlabShell>
                    <SpeechToTextButton
                      style={styles.openerMic}
                      value={field.value ?? ''}
                      onChangeText={field.onChange}
                    />
                  </View>
                  {errors.opener ? <Text style={styles.errorText}>{String(errors.opener.message)}</Text> : null}
                </View>
              )}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>תגובה</Text>
          <Controller
            control={control}
            name="response"
            render={({ field }) => (
              <View style={styles.responseGrid}>
                {RESPONSE_OPTIONS.map((opt) => {
                  const active = field.value === opt.value
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => field.onChange(opt.value)}
                      style={({ pressed }) => [
                        styles.responseCell,
                        active && styles.responseCellActive,
                        pressed && { opacity: 0.92 },
                      ]}
                    >
                      <MaterialIcons
                        name={opt.icon}
                        size={30}
                        color={active ? C.primary : opt.iconColor}
                      />
                      <Text style={styles.responseLabel}>{opt.label}</Text>
                    </Pressable>
                  )
                })}
              </View>
            )}
          />
        </View>

        <View style={styles.section}>
          <Controller
            control={control}
            name="chemistry_score"
            render={({ field }) => (
              <>
                <View style={styles.chemHeader}>
                  <Text style={styles.chemValue}>
                    {Number(field.value) || 5}/10
                  </Text>
                  <Text style={styles.fieldLabel}>כימיה</Text>
                </View>
                <Text style={styles.chemistryHint}>{CHEMISTRY_HINT}</Text>
                <View style={styles.sliderWrap}>
                  <View style={styles.sliderTrackBg}>
                    <LinearGradient
                      colors={[C.primary, C.primaryDim]}
                      start={{ x: 1, y: 0 }}
                      end={{ x: 0, y: 0 }}
                      style={[
                        styles.sliderFill,
                        { width: `${((Number(field.value) || 5) / 10) * 100}%` },
                      ]}
                    />
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={10}
                    step={1}
                    value={Number(field.value) || 5}
                    onValueChange={(v) => {
                      const n = Array.isArray(v) ? v[0] : v
                      field.onChange(Math.round(n))
                    }}
                    minimumTrackTintColor="transparent"
                    maximumTrackTintColor="transparent"
                    thumbTintColor="#ffffff"
                  />
                </View>
              </>
            )}
          />
          {errors.chemistry_score ? (
            <Text style={styles.errorText}>{String(errors.chemistry_score.message)}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>מה הלאה</Text>
          <Text style={styles.followSubtitle}>
            מה קרה אחרי הפנייה — בחר את האפשרות הכי מדויקת
          </Text>
          <Controller
            control={control}
            name="follow_up"
            render={({ field }) => {
              const followVal = field.value ?? 'nothing'
              return (
              <View>
                <Pressable
                  onPress={() => setFollowMenuOpen((o) => !o)}
                  accessibilityRole="button"
                  accessibilityLabel="פתח רשימת תוצאות"
                >
                  <SlabShell focused={followMenuOpen}>
                    <View style={[styles.slabRow, styles.followTriggerRow]}>
                      <Text
                        style={[styles.slabSelectText, fontsReady && { fontFamily: 'Inter_600SemiBold' }]}
                        numberOfLines={2}
                      >
                        {FOLLOW_UP_LABELS[followVal]}
                      </Text>
                      <MaterialIcons
                        name={followMenuOpen ? 'expand-less' : 'expand-more'}
                        size={22}
                        color={C.primaryDim}
                        style={styles.followChevron}
                      />
                    </View>
                  </SlabShell>
                </Pressable>
                {followMenuOpen ? (
                  <View style={styles.followMenu}>
                    {FOLLOW_UP_OPTIONS.map((opt, idx) => {
                      const selected = followVal === opt.value
                      const isLast = idx === FOLLOW_UP_OPTIONS.length - 1
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => {
                            field.onChange(opt.value)
                            setFollowMenuOpen(false)
                          }}
                          style={({ pressed }) => [
                            styles.followMenuItem,
                            !isLast && styles.followMenuItemBorder,
                            selected && styles.followMenuItemSelected,
                            pressed && { opacity: 0.92 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.followMenuItemText,
                              selected && styles.followMenuItemTextSelected,
                              fontsReady && {
                                fontFamily: selected ? 'Inter_700Bold' : 'Inter_400Regular',
                              },
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                ) : null}
              </View>
            )
            }}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>הערות</Text>
          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <View style={styles.notesRow}>
                <SlabShell focused={notesFocus} style={styles.notesSlab}>
                  <TextInput
                    placeholder="איך היא נראתה? מה היה הקטע המיוחד?"
                    placeholderTextColor={C.outline}
                    style={[styles.notesInput, fontsReady && { fontFamily: 'Inter_600SemiBold' }]}
                    multiline
                    numberOfLines={3}
                    value={field.value ?? ''}
                    onChangeText={field.onChange}
                    onFocus={() => setNotesFocus(true)}
                    onBlur={() => setNotesFocus(false)}
                    textAlign="right"
                    textAlignVertical="top"
                  />
                </SlabShell>
                <SpeechToTextButton
                  style={styles.notesMic}
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                />
              </View>
            )}
          />
        </View>
      </KeyboardAwareScrollView>

      <View
        style={[
          styles.footerSticky,
          { paddingBottom: Math.max(insets.bottom, 2) },
        ]}
      >
        <Pressable
          style={({ pressed }) => [pressed && { opacity: 0.95 }]}
          onPress={handleSubmit(onFormSubmit)}
          disabled={!isValid}
        >
          <LinearGradient
            colors={[C.primary, C.primaryDim]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.saveGradient, !isValid && styles.saveDisabled]}
          >
            <Text style={styles.saveText}>שמור</Text>
          </LinearGradient>
        </Pressable>
      </View>
      {/* מארח Toast — בטאבים lazy אין Toast ממסכים אחרים; בתוך טופס זה מספיק */}
      <Toast />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loadingWrap: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.surfaceLow,
  },
  sheetRoot: {
    flex: 1,
    backgroundColor: C.bg,
  },
  columnFill: {
    flex: 1,
    position: 'relative',
    backgroundColor: C.bg,
  },
  header: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(72, 72, 71, 0.35)',
    backgroundColor: `${C.surfaceLow}cc`,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 22,
    letterSpacing: -0.5,
    color: C.onSurface,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollFill: {
    flex: 1,
    flexGrow: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 32,
  },
  grid2: {
    flexDirection: 'row',
    gap: 16,
  },
  gridCell: {
    flex: 1,
    gap: 8,
  },
  fieldLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: C.onVariant,
    textAlign: 'right',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  slab: {
    backgroundColor: C.surfaceHigh,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  slabFocused: {
    borderBottomColor: C.primary,
  },
  slabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 48,
  },
  slabStartIcon: {
    marginEnd: 12,
  },
  slabEndIcon: {
    marginStart: 8,
  },
  slabInputText: {
    flex: 1,
    fontSize: 15,
    color: C.onSurface,
    textAlign: 'right',
    paddingVertical: 12,
  },
  slabSelectText: {
    flex: 1,
    fontSize: 15,
    color: C.onSurface,
    textAlign: 'right',
    paddingVertical: 12,
  },
  placeholderText: {
    color: C.outline,
  },
  typeOpenerRow: {
    gap: 24,
  },
  typeBlock: {
    gap: 12,
  },
  openerBlock: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    width: '100%',
  },
  charCount: {
    fontSize: 11,
    color: C.outline,
  },
  /** מבטל את paddingHorizontal של הגלילה — «ישירה» צמודה לימין; paddingEnd = ריווח משמאל כשהשורה נשברת */
  chipBleed: {
    marginHorizontal: -24,
    paddingEnd: 24,
  },
  chipWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: C.surfaceHigh,
  },
  chipActive: {
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  chipText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: C.onVariant,
  },
  chipTextActive: {
    color: C.onPrimaryFixed,
  },
  section: {
    gap: 12,
  },
  responseGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  responseCell: {
    flex: 1,
    minWidth: 68,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: C.surfaceHigh,
    gap: 8,
  },
  responseCellActive: {
    backgroundColor: C.surfaceHighest,
    borderWidth: 1,
    borderColor: `${C.primary}55`,
  },
  responseLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: C.onVariant,
    textAlign: 'center',
  },
  chemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 12,
  },
  chemistryHint: {
    fontSize: 12,
    color: C.onVariant,
    textAlign: 'right',
    paddingHorizontal: 4,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 4,
  },
  chemValue: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 20,
    color: C.primary,
  },
  sliderWrap: {
    marginTop: 8,
    justifyContent: 'center',
    height: 40,
  },
  sliderTrackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 8,
    borderRadius: 999,
    backgroundColor: C.surfaceHighest,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 999,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  openerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'stretch',
    gap: 10,
  },
  openerSlab: {
    flex: 1,
    minHeight: 112,
  },
  openerInput: {
    minHeight: 112,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: C.onSurface,
  },
  openerMic: {
    alignSelf: 'center',
    justifyContent: 'center',
  },
  notesRow: {
    flexDirection: 'row-reverse',
    alignItems: 'stretch',
    gap: 10,
  },
  notesSlab: {
    flex: 1,
    minHeight: 88,
  },
  notesMic: {
    alignSelf: 'center',
    justifyContent: 'center',
  },
  notesInput: {
    minHeight: 88,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: C.onSurface,
    textAlignVertical: 'top',
  },
  followSubtitle: {
    fontSize: 12,
    color: C.outline,
    textAlign: 'right',
    paddingHorizontal: 4,
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 17,
  },
  followTriggerRow: {
    minHeight: 52,
    alignItems: 'center',
  },
  followChevron: {
    marginStart: 8,
    flexShrink: 0,
  },
  followMenu: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: C.surfaceHigh,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.outlineVariant,
  },
  followMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  followMenuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(72, 72, 71, 0.45)',
  },
  followMenuItemSelected: {
    backgroundColor: C.surfaceHighest,
  },
  followMenuItemText: {
    fontSize: 15,
    color: C.onSurface,
    textAlign: 'right',
  },
  followMenuItemTextSelected: {
    color: C.primary,
  },
  dateModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dateModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  dateModalSheet: {
    backgroundColor: C.surfaceHigh,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  dateModalToolbar: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(72, 72, 71, 0.45)',
  },
  dateModalDone: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: C.primary,
    textAlign: 'right',
  },
  footerSticky: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
    paddingTop: 6,
    paddingHorizontal: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(72, 72, 71, 0.45)',
    backgroundColor: 'rgba(19, 19, 19, 0.97)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 24,
    zIndex: 40,
  },
  saveGradient: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: C.primaryDim,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 6,
  },
  saveDisabled: {
    opacity: 0.45,
  },
  saveText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 17,
    letterSpacing: 2,
    color: C.onPrimaryFixed,
    textTransform: 'uppercase',
  },
  errorText: {
    color: C.error,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
})
