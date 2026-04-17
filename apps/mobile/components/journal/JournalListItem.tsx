import React from 'react'
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Ionicons } from '@expo/vector-icons'
import type { Approach, ApproachType, FollowUpType } from '@gash/types'
import { BREAKPOINT_NARROW } from '@/lib/responsiveLayout'

const TYPE_LABEL: Record<ApproachType, string> = {
  direct: 'ישירה',
  situational: 'מצבית',
  humor: 'הומור',
  online: 'אונליין',
}

const TYPE_ICON: Record<ApproachType, { lib: 'material' | 'ionicons'; name: string }> = {
  direct: { lib: 'material', name: 'bolt' },
  situational: { lib: 'material', name: 'psychology' },
  humor: { lib: 'material', name: 'sentiment-very-satisfied' },
  online: { lib: 'material', name: 'public' },
}

const RESULT_META: Record<
  FollowUpType,
  { lib: 'material' | 'ionicons'; icon: string; label: string }
> = {
  meeting:   { lib: 'material',  icon: 'favorite',          label: 'דייט נקבע' },
  text:      { lib: 'material',  icon: 'sms',               label: 'הוחלפו מספרים' },
  phone:     { lib: 'material',  icon: 'phone',             label: 'שוחחנו' },
  instagram: { lib: 'ionicons',  icon: 'logo-instagram',    label: 'אינסטגרם' },
  instant:   { lib: 'material',  icon: 'flare',             label: 'ניצוץ' },
  coffee:    { lib: 'material',  icon: 'local-cafe',        label: 'קפה ביחד' },
  kiss:      { lib: 'material',  icon: 'favorite',          label: 'נשיקה' },
  went_home: { lib: 'material',  icon: 'home',              label: 'הלכנו הביתה' },
  nothing:   { lib: 'material',  icon: 'close',             label: 'שיחה קצרה' },
}

function starsFromScore(score: number | null): number {
  if (score == null || Number.isNaN(score)) return 0
  return Math.min(5, Math.max(0, Math.round(score / 2)))
}

function chemistryTierHebrew(score: number | null): string {
  if (score == null) return 'לא צוין'
  if (score >= 9) return 'מעולה'
  if (score >= 7) return 'גבוהה'
  if (score >= 5) return 'בינונית'
  if (score >= 3) return 'נמוכה'
  return 'נמוכה מאוד'
}

function chemistryColor(score: number | null): string {
  if (score == null) return ON_VARIANT
  if (score >= 8) return '#81ecff'
  if (score >= 5) return '#f0c040'
  return '#ff716c'
}

interface JournalListItemProps {
  approach: Approach
  listIndex: number
  onPress: () => void
}

const PRIMARY = '#81ecff'
const TERTIARY = '#a2aaff'
const SURFACE_CONTAINER = '#1a1a1a'
const SURFACE_LOW = '#131313'
const ON_SURFACE = '#ffffff'
const ON_VARIANT = '#adaaaa'
const OUTLINE_VARIANT = '#484847'
const ICON_COLOR = '#929bfa'

function MetaIcon({
  lib,
  name,
  size,
  color,
}: {
  lib: 'material' | 'ionicons'
  name: string
  size: number
  color: string
}) {
  if (lib === 'ionicons') {
    return <Ionicons name={name as any} size={size} color={color} />
  }
  return <MaterialIcons name={name as any} size={size} color={color} />
}

export default function JournalListItem({
  approach,
  listIndex,
  onPress,
}: JournalListItemProps) {
  const { width } = useWindowDimensions()
  const isNarrow = width < BREAKPOINT_NARROW

  const type = approach.approach_type ?? 'direct'
  const typeLabel = TYPE_LABEL[type] ?? type
  const typeMeta = TYPE_ICON[type] ?? { lib: 'material', name: 'help-outline' }

  const follow = approach.follow_up ?? 'nothing'
  const result = RESULT_META[follow] ?? RESULT_META.nothing

  const dateStr = new Date(approach.date).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const filledStars = starsFromScore(approach.chemistry_score)
  const accentColor = listIndex % 2 === 0 ? PRIMARY : TERTIARY
  const title = approach.location?.trim() || 'ללא מיקום'
  const scoreColor = chemistryColor(approach.chemistry_score)
  const pillColor = chemistryColor(approach.chemistry_score)

  const iconSize = isNarrow ? 18 : 20
  const metaFontSize = isNarrow ? 12 : 14
  const titleFontSize = isNarrow ? 17 : 20
  const cardPadding = isNarrow ? 14 : 20

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { borderStartColor: accentColor, padding: cardPadding },
        pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`גישה ב${title}, ${dateStr}`}
    >
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.dateSmall}>{dateStr}</Text>
          <Text style={[styles.locationTitle, { fontSize: titleFontSize }]} numberOfLines={2}>
            {title}
          </Text>
        </View>
        <View style={styles.starsRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <MaterialIcons
              key={i}
              name={i < filledStars ? 'star' : 'star-border'}
              size={isNarrow ? 14 : 16}
              color={scoreColor}
            />
          ))}
        </View>
      </View>

      <View style={styles.metaBox}>
        {/* סוג גישה */}
        <View style={styles.metaChunk}>
          <MetaIcon lib={typeMeta.lib} name={typeMeta.name} size={iconSize} color={ICON_COLOR} />
          <Text style={[styles.metaBold, { fontSize: metaFontSize }]} numberOfLines={1}>
            {typeLabel}
          </Text>
        </View>
        <View style={styles.metaDivider} />
        {/* תוצאה */}
        <View style={styles.metaChunk}>
          <MetaIcon lib={result.lib} name={result.icon} size={iconSize} color={ICON_COLOR} />
          <Text style={[styles.metaBold, { fontSize: metaFontSize }]} numberOfLines={1}>
            {result.label}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={[styles.chemPill, { borderColor: `${pillColor}33` }]}>
          <View style={[styles.chemPillDot, { backgroundColor: pillColor }]} />
          <Text style={[styles.chemPillText, { color: pillColor, fontSize: isNarrow ? 11 : 13 }]}>
            {chemistryTierHebrew(approach.chemistry_score)}
          </Text>
        </View>
        <View style={styles.detailsBtn}>
          <Text style={[styles.detailsText, { fontSize: isNarrow ? 12 : 14 }]}>לפרטים</Text>
          <MaterialIcons name="arrow-forward" size={isNarrow ? 16 : 18} color={PRIMARY} />
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SURFACE_CONTAINER,
    borderRadius: 16,
    borderStartWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleBlock: {
    flex: 1,
    paddingEnd: 8,
    alignItems: 'flex-end',
  },
  dateSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: ON_VARIANT,
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  locationTitle: {
    fontWeight: '700',
    color: ON_SURFACE,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    paddingTop: 2,
    flexShrink: 0,
  },
  metaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: SURFACE_LOW,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  metaChunk: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  metaDivider: {
    width: 1,
    height: 16,
    backgroundColor: `${OUTLINE_VARIANT}4d`,
    flexShrink: 0,
  },
  metaBold: {
    fontWeight: '700',
    color: ON_SURFACE,
    textAlign: 'right',
    flex: 1,
    writingDirection: 'rtl',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chemPill: {
    backgroundColor: '#262626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chemPillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
  },
  chemPillText: {
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsText: {
    fontWeight: '700',
    color: PRIMARY,
  },
})
