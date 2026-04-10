import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import type { Tip } from '@gash/constants'

interface TipCardProps {
  tip: Tip
  variant?: 'default' | 'featured'
  categoryLabel: string
  readMinutes: number
}

function iconForCategory(category: Tip['category']): React.ComponentProps<typeof MaterialIcons>['name'] {
  switch (category) {
    case 'אישור':
      return 'forum'
    case 'ביטחון':
      return 'psychology'
    case 'זיהוי':
      return 'accessibility-new'
    case 'ליווי':
      return 'trending-up'
    default:
      return 'article'
  }
}

export default function TipCard({
  tip,
  variant = 'default',
  categoryLabel,
  readMinutes,
}: TipCardProps) {
  const icon = iconForCategory(tip.category)

  if (variant === 'featured') {
    return (
      <View style={styles.featuredOuter}>
        <View style={styles.featuredInner}>
          <View style={styles.featuredTop}>
            <View style={styles.badgeRecommended}>
              <Text style={styles.badgeRecommendedText}>מומלץ עבורך</Text>
            </View>
            <MaterialIcons name="star" size={22} color="#81ecff" />
          </View>
          <Text style={styles.featuredTitle}>{tip.title}</Text>
          <Text style={styles.featuredDesc}>{tip.description}</Text>
          <View style={styles.readMoreRow}>
            <MaterialIcons name="arrow-forward" size={16} color="#81ecff" style={styles.flipIcon} />
            <Text style={styles.readMoreText}>קרא עוד</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <MaterialIcons name={icon} size={26} color="#00d4ec" />
        </View>
        <View style={styles.body}>
          <View style={styles.metaRow}>
            <Text style={styles.catLabel}>{categoryLabel}</Text>
            <Text style={styles.readTime}>{readMinutes} דק׳ קריאה</Text>
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
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(72, 72, 71, 0.35)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
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
    color: '#929bfa',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  readTime: {
    fontSize: 10,
    color: '#adaaaa',
  },
  title: {
    fontSize: 18,
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
  featuredOuter: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(129, 236, 255, 0.35)',
    backgroundColor: '#20201f',
    overflow: 'hidden',
  },
  featuredInner: {
    padding: 20,
  },
  featuredTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeRecommended: {
    backgroundColor: '#81ecff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeRecommendedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#003840',
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'right',
    marginBottom: 8,
  },
  featuredDesc: {
    fontSize: 14,
    color: '#adaaaa',
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: 16,
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#81ecff',
  },
  flipIcon: {
    transform: [{ scaleX: -1 }],
  },
})
