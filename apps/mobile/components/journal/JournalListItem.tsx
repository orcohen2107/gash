import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import type { Approach } from '@gash/types'

const APPROACH_TYPE_LABELS: Record<string, string> = {
  direct: 'ישיר',
  situational: 'סיטואטיבי',
  humor: 'הומור',
  online: 'אונליין',
}

const FOLLOW_UP_LABELS: Record<string, string> = {
  meeting: '🤝 מפגש',
  text: '💬 הודעה',
  instagram: '📸 אינסטגרם',
  nothing: '❌ כלום',
}

function getChemistryColor(score: number): string {
  if (score <= 3) return '#ff6b6b' // Red
  if (score <= 6) return '#ffb700' // Orange
  return '#00d9a3' // Green
}

interface JournalListItemProps {
  approach: Approach
  onPress: () => void
}

export default function JournalListItem({ approach, onPress }: JournalListItemProps) {
  const chemistryColor = getChemistryColor(approach.chemistry_score ?? 0)
  const dateStr = new Date(approach.date).toLocaleDateString('he-IL')
  const typeLabel = APPROACH_TYPE_LABELS[approach.approach_type ?? ''] || approach.approach_type
  const followUpLabel = FOLLOW_UP_LABELS[approach.follow_up ?? ''] || '—'

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.leftContent}>
        {/* Chemistry badge */}
        <View
          style={[
            styles.chemistryBadge,
            { backgroundColor: chemistryColor },
          ]}
        >
          <Text style={styles.chemistryValue}>{approach.chemistry_score}</Text>
        </View>

        {/* Main content */}
        <View style={styles.mainContent}>
          {/* Date and location */}
          <View style={styles.headerRow}>
            <Text style={styles.location} numberOfLines={1}>
              {approach.location}
            </Text>
            <Text style={styles.date}>{dateStr}</Text>
          </View>

          {/* Type and follow-up */}
          <View style={styles.footerRow}>
            <Text style={styles.followUp}>{followUpLabel}</Text>
            <Text style={styles.type}>{typeLabel}</Text>
          </View>
        </View>
      </View>

      {/* Chevron */}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#20201f',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a29',
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  chemistryBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chemistryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  mainContent: {
    flex: 1,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'right',
    marginStart: 8,
  },
  date: {
    fontSize: 12,
    color: '#adaaaa',
    textAlign: 'left',
  },
  footerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  type: {
    fontSize: 12,
    color: '#81ecff',
    fontWeight: '600',
    textAlign: 'right',
  },
  followUp: {
    fontSize: 12,
    color: '#adaaaa',
    textAlign: 'left',
  },
  chevron: {
    fontSize: 24,
    color: '#adaaaa',
    fontWeight: '300',
  },
})
