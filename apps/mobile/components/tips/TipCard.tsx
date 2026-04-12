import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import type { Tip } from '@gash/constants'
import { useHorizontalGutter } from '@/lib/responsiveLayout'

interface TipCardProps {
  tip: Tip
  categoryLabel: string
}

function iconForCategory(category: Tip['category']): React.ComponentProps<typeof MaterialIcons>['name'] {
  switch (category) {
    case 'אישור':
      return 'forum'
    case 'ביטחון':
      return 'psychology'
    case 'זיהוי':
      return 'accessibility-new'
    case 'פלירטוט':
      return 'favorite'
    case 'ליווי':
      return 'trending-up'
    default:
      return 'article'
  }
}

export default function TipCard({
  tip,
  categoryLabel,
}: TipCardProps) {
  const gutter = useHorizontalGutter()
  const icon = iconForCategory(tip.category)
  const sideMargin = { marginHorizontal: gutter }

  return (
    <View style={[styles.card, sideMargin]}>
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <MaterialIcons name={icon} size={22} color="#00d4ec" />
        </View>
        <View style={styles.body}>
          <View style={styles.metaRow}>
            <Text style={styles.catLabel}>{categoryLabel}</Text>
          </View>
          <Text style={styles.title}>{tip.title}</Text>
          <Text style={styles.description} numberOfLines={3}>
            {tip.description}
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    padding: 14,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(72, 72, 71, 0.35)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#2c2c2c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  catLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#81ecff',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'right',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#adaaaa',
    lineHeight: 18,
    textAlign: 'right',
  },
})
