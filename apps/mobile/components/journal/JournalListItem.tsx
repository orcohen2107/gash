import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import type { Approach, ApproachType, FollowUpType } from '@gash/types'

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

/** תצוגת יומן — ניסוחים קצרים כמו במוקאפ */
const RESULT_ICON: Record<
  FollowUpType,
  { icon: keyof typeof MaterialIcons.glyphMap; label: string }
> = {
  meeting: { icon: 'favorite', label: 'דייט נקבע' },
  text: { icon: 'chat', label: 'הוחלפו מספרים' },
  instagram: { icon: 'photo-camera', label: 'המשך באינסטגרם' },
  nothing: { icon: 'close', label: 'שיחה קצרה' },
  phone: { icon: 'chat', label: 'הוחלפו מספרים' },
  instant: { icon: 'flare', label: 'ניצוץ במקום' },
  coffee: { icon: 'local-cafe', label: 'ישבנו לקפה' },
  kiss: { icon: 'favorite', label: 'נשיקה' },
  went_home: { icon: 'home', label: 'המשכנו הביתה' },
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

export default function JournalListItem({
  approach,
  listIndex,
  onPress,
}: JournalListItemProps) {
  const type = approach.approach_type ?? 'direct'
  const typeLabel = TYPE_LABEL[type] ?? type
  const typeIcon = TYPE_ICON[type] ?? 'help-outline'

  const follow = approach.follow_up ?? 'nothing'
  const result = RESULT_ICON[follow] ?? RESULT_ICON.nothing

  const dateStr = new Date(approach.date).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const filledStars = starsFromScore(approach.chemistry_score)
  const accentColor = listIndex % 2 === 0 ? PRIMARY : TERTIARY
  const title = approach.location?.trim() || 'ללא מיקום'

  return (
    <Pressable
      style={[styles.card, { borderStartColor: accentColor }]}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.dateSmall}>{dateStr}</Text>
          <Text style={styles.locationTitle} numberOfLines={2}>
            {title}
          </Text>
        </View>
        <View style={styles.starsRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <MaterialIcons
              key={i}
              name={i < filledStars ? 'star' : 'star-border'}
              size={16}
              color={PRIMARY}
            />
          ))}
        </View>
      </View>

      <View style={styles.metaBox}>
        <View style={styles.metaChunk}>
          <MaterialIcons name={typeIcon} size={20} color="#929bfa" />
          <Text style={styles.metaBold}>
            סוג: {typeLabel}
          </Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaChunk}>
          <MaterialIcons name={result.icon} size={20} color="#929bfa" />
          <Text style={styles.metaBold} numberOfLines={1}>
            תוצאה: {result.label}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.chemPill}>
          <Text style={styles.chemPillText}>
            כימיה: {chemistryTierHebrew(approach.chemistry_score)}
          </Text>
        </View>
        <View style={styles.detailsBtn}>
          <Text style={styles.detailsText}>לפרטים</Text>
          <MaterialIcons name="arrow-back" size={18} color={PRIMARY} />
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SURFACE_CONTAINER,
    borderRadius: 16,
    padding: 20,
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
    fontSize: 20,
    fontWeight: '700',
    color: ON_SURFACE,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    paddingTop: 2,
  },
  metaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SURFACE_LOW,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  metaChunk: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaDivider: {
    width: 1,
    height: 16,
    backgroundColor: `${OUTLINE_VARIANT}4d`,
  },
  metaBold: {
    fontSize: 14,
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chemPillText: {
    fontSize: 14,
    color: ON_VARIANT,
    writingDirection: 'rtl',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsText: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
  },
})
