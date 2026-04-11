import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Alert,
  useWindowDimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'
import type { Approach, ApproachType } from '@gash/types'
import { FOLLOW_UP_LABELS } from '@gash/constants'
import { useLogStore } from '@/stores/useLogStore'

const BG = '#0e0e0e'
const SURFACE_LOW = '#131313'
const SURFACE_CONTAINER = '#1a1a1a'
const SURFACE_HIGH = '#20201f'
const SURFACE_HIGHEST = '#262626'
const ON_SURFACE = '#ffffff'
const ON_VARIANT = '#adaaaa'
const PRIMARY = '#81ecff'
const PRIMARY_DIM = '#00d4ec'
const TERTIARY = '#a2aaff'
const TERTIARY_DIM = '#929bfa'
const ON_PRIMARY_FIXED = '#003840'
const OUTLINE_VARIANT_10 = 'rgba(72, 72, 71, 0.1)'
const ERROR = '#ff716c'

const TYPE_LABEL: Record<ApproachType, string> = {
  direct: 'ישירה',
  situational: 'מצבית',
  humor: 'הומור',
  online: 'אונליין',
}

const TYPE_ICON: Record<ApproachType, keyof typeof MaterialIcons.glyphMap> = {
  direct: 'bolt',
  situational: 'psychology',
  humor: 'sentiment-very-satisfied',
  online: 'public',
}

const RESPONSE_DISPLAY: Record<string, string> = {
  positive: 'חיובית מאוד',
  neutral: 'ניטרלית',
  dismissive: 'שלילית',
  negative: 'שלילית',
  ignored: 'התעלמות',
}

const RESPONSE_ICON: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  positive: 'mood',
  neutral: 'sentiment-neutral',
  dismissive: 'sentiment-very-dissatisfied',
  negative: 'sentiment-very-dissatisfied',
  ignored: 'block',
}

interface ApproachDetailScreenProps {
  approach: Approach
  visible: boolean
  onDismiss: () => void
}

function formatDateTimeLine(dateStr: string): string {
  const iso = dateStr.length <= 10 ? `${dateStr}T12:00:00` : dateStr
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return dateStr
  const datePart = d.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  if (dateStr.length <= 10) return datePart
  const timePart = d.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${datePart} • ${timePart}`
}

export default function ApproachDetailScreen({
  approach,
  visible,
  onDismiss,
}: ApproachDetailScreenProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const deleteApproach = useLogStore((s) => s.deleteApproach)
  const setPendingEditApproach = useLogStore((s) => s.setPendingEditApproach)

  const contentMaxW = Math.min(672, width)

  const typeKey = approach.approach_type ?? 'direct'
  const typeLabel = TYPE_LABEL[typeKey] ?? typeKey
  const typeIcon = TYPE_ICON[typeKey] ?? 'help-outline'

  const responseKey = approach.response ?? ''
  const responseLabel =
    RESPONSE_DISPLAY[responseKey] ??
    (responseKey ? responseKey : 'לא צוין')
  const responseIcon: keyof typeof MaterialIcons.glyphMap =
    RESPONSE_ICON[responseKey] ?? 'mood'

  const followKey = approach.follow_up
  const followLabel =
    followKey && followKey in FOLLOW_UP_LABELS
      ? FOLLOW_UP_LABELS[followKey as keyof typeof FOLLOW_UP_LABELS]
      : followKey ?? '—'

  const chemistry = approach.chemistry_score
  const chemPct =
    chemistry != null ? Math.min(100, Math.max(0, chemistry * 10)) : 0

  const handleDelete = async () => {
    try {
      await deleteApproach(approach.id)
      Toast.show({ type: 'success', text1: 'הגישה נמחקה' })
      onDismiss()
    } catch (err) {
      console.error('Delete error:', err)
      Toast.show({
        type: 'error',
        text1: 'בעיה במחיקה',
        text2: 'נסה שוב',
      })
    }
  }

  const handleDeletePress = () => {
    Alert.alert(
      'מחק את התיעוד?',
      'לא ניתן לשחזר את הרישום לאחר מחיקה',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: handleDelete,
        },
      ]
    )
  }

  const handleEdit = () => {
    setPendingEditApproach(approach)
    onDismiss()
    router.push('/(tabs)/log')
  }

  const openerText = approach.opener?.trim()
  const notesText = approach.notes?.trim()

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onDismiss}
    >
      <StatusBar style="light" />
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* Top bar */}
        <View style={[styles.topBar, { paddingHorizontal: Math.max(16, (width - contentMaxW) / 2 + 16) }]}>
          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => [styles.topBarSide, pressed && { opacity: 0.85 }]}
            accessibilityLabel="סגור"
            hitSlop={10}
          >
            <MaterialIcons name="close" size={26} color={PRIMARY} />
          </Pressable>
          <Text style={styles.topTitle} numberOfLines={1}>
            פרטי גישה
          </Text>
          <View style={[styles.topBarSide, styles.topBarSideEnd]}>
            <Text style={styles.brandGash}>Gash</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: insets.bottom + 32,
              paddingHorizontal: Math.max(16, (width - contentMaxW) / 2 + 16),
            },
          ]}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <View style={styles.hero}>
            <LinearGradient
              colors={[PRIMARY, TERTIARY, PRIMARY_DIM]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.heroTopStripe}
            />
            <View style={styles.heroInner}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroTitleBlock}>
                  <Text style={styles.labelMd}>תאריך וזמן</Text>
                  <Text style={styles.heroDateTitle}>
                    {formatDateTimeLine(approach.date)}
                  </Text>
                </View>
                <View style={styles.calWrap}>
                  <MaterialIcons name="calendar-today" size={32} color={PRIMARY} />
                </View>
              </View>
              <View style={styles.locRow}>
                <MaterialIcons name="location-on" size={22} color={TERTIARY} />
                <Text style={styles.locText}>
                  {approach.location?.trim() || 'לא צוין מיקום'}
                </Text>
              </View>
            </View>
          </View>

          {/* Bento row 1 */}
          <View style={styles.bentoRow}>
            <View style={[styles.bentoCell, styles.bentoHalf]}>
              <View style={styles.bentoHead}>
                <View style={styles.iconBox}>
                  <MaterialIcons name={typeIcon} size={22} color={PRIMARY_DIM} />
                </View>
                <Text style={styles.bentoLabel}>סוג גישה</Text>
              </View>
              <Text style={styles.bentoValue}>{typeLabel}</Text>
            </View>
            <View style={[styles.bentoCell, styles.bentoHalf]}>
              <View style={styles.bentoHead}>
                <View style={styles.iconBox}>
                  <MaterialIcons name={responseIcon} size={22} color={PRIMARY_DIM} />
                </View>
                <Text style={styles.bentoLabel}>תגובה</Text>
              </View>
              <View style={styles.responseRow}>
                <View style={styles.responseDot} />
                <Text style={styles.bentoValue}>{responseLabel}</Text>
              </View>
            </View>
          </View>

          {/* המשך */}
          <View style={styles.bentoFull}>
            <View style={styles.bentoHead}>
              <View style={styles.iconBox}>
                <MaterialIcons name="flag" size={22} color={PRIMARY_DIM} />
              </View>
              <Text style={styles.bentoLabel}>תוצאה / המשך</Text>
            </View>
            <Text style={styles.bentoValue}>{followLabel}</Text>
          </View>

          {/* Opener */}
          <View style={styles.bentoFull}>
            <View style={styles.bentoHead}>
              <View style={styles.iconBox}>
                <MaterialIcons name="chat-bubble-outline" size={22} color={PRIMARY_DIM} />
              </View>
              <Text style={styles.bentoLabel}>פתיחה</Text>
            </View>
            <View style={styles.glassQuote}>
              <Text style={styles.quoteText}>
                {openerText ? `״${openerText}״` : '—'}
              </Text>
            </View>
          </View>

          {/* Chemistry */}
          <View style={styles.bentoFull}>
            <View style={styles.chemHeadRow}>
              <View style={styles.bentoHead}>
                <View style={styles.iconBox}>
                  <MaterialIcons name="science" size={22} color={PRIMARY_DIM} />
                </View>
                <Text style={styles.bentoLabel}>כימיה</Text>
              </View>
              <Text style={styles.chemScoreBig}>
                {chemistry != null ? `${chemistry}/10` : '—'}
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFillWrap, { width: `${chemPct}%` }]}>
                <View style={styles.barFill} />
              </View>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.bentoFull}>
            <View style={styles.bentoHead}>
              <View style={styles.iconBox}>
                <MaterialIcons name="notes" size={22} color={PRIMARY_DIM} />
              </View>
              <Text style={styles.bentoLabel}>הערות</Text>
            </View>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{notesText || '—'}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={handleEdit}
              style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}
            >
              <LinearGradient
                colors={[PRIMARY, PRIMARY_DIM]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.btnPrimary}
              >
                <MaterialIcons name="edit" size={22} color={ON_PRIMARY_FIXED} />
                <Text style={styles.btnPrimaryText}>ערוך גישה</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={handleDeletePress}
              style={({ pressed }) => [
                styles.btnDanger,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <MaterialIcons name="delete-outline" size={22} color={ERROR} />
              <Text style={styles.btnDangerText}>מחק תיעוד</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    minHeight: 56,
  },
  topBarSide: {
    width: 72,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  topBarSideEnd: {
    alignItems: 'flex-end',
  },
  brandGash: {
    fontSize: 20,
    fontWeight: '700',
    color: PRIMARY,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  topTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: PRIMARY,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    maxWidth: 672,
    alignSelf: 'center',
    width: '100%',
    gap: 24,
    paddingTop: 8,
  },
  hero: {
    borderRadius: 12,
    backgroundColor: SURFACE_LOW,
    borderWidth: 1,
    borderColor: OUTLINE_VARIANT_10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  heroTopStripe: {
    height: 4,
    width: '100%',
  },
  heroInner: {
    padding: 24,
    gap: 24,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroTitleBlock: {
    flex: 1,
    gap: 4,
    alignItems: 'flex-end',
  },
  labelMd: {
    fontSize: 14,
    fontWeight: '500',
    color: ON_VARIANT,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  heroDateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ON_SURFACE,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  calWrap: {
    backgroundColor: 'rgba(129, 236, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: SURFACE_CONTAINER,
    borderRadius: 8,
    padding: 12,
  },
  locText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: ON_SURFACE,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  bentoHalf: {
    flex: 1,
    minWidth: 0,
  },
  bentoCell: {
    backgroundColor: SURFACE_LOW,
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  bentoFull: {
    backgroundColor: SURFACE_LOW,
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  bentoHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: SURFACE_HIGH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: ON_VARIANT,
    textAlign: 'right',
    writingDirection: 'rtl',
    flex: 1,
  },
  bentoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: ON_SURFACE,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingEnd: 4,
  },
  responseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  },
  responseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
  },
  glassQuote: {
    backgroundColor: 'rgba(38, 38, 38, 0.85)',
    borderRadius: 12,
    padding: 16,
    borderStartWidth: 4,
    borderStartColor: PRIMARY,
  },
  quoteText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: ON_SURFACE,
    lineHeight: 28,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  chemHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  chemScoreBig: {
    fontSize: 24,
    fontWeight: '900',
    color: TERTIARY,
    writingDirection: 'ltr',
  },
  barTrack: {
    height: 16,
    width: '100%',
    backgroundColor: SURFACE_HIGHEST,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  barFillWrap: {
    height: '100%',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  barFill: {
    flex: 1,
    borderRadius: 9999,
    backgroundColor: TERTIARY,
    shadowColor: TERTIARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 4,
  },
  notesBox: {
    backgroundColor: SURFACE_CONTAINER,
    borderRadius: 8,
    padding: 16,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actions: {
    gap: 12,
    paddingTop: 12,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  btnPrimaryText: {
    fontSize: 18,
    fontWeight: '700',
    color: ON_PRIMARY_FIXED,
  },
  btnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 113, 108, 0.2)',
    backgroundColor: 'rgba(255, 113, 108, 0.05)',
  },
  btnDangerText: {
    fontSize: 18,
    fontWeight: '700',
    color: ERROR,
  },
})
