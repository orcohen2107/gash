import React from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import { BADGES } from '@gash/constants'
import { useBadgesStore } from '@/stores/useBadgesStore'

export default function BadgeGallery() {
  const unlockedBadges = useBadgesStore((state) => state.unlockedBadges)
  const unlockedIds = new Set(unlockedBadges.map((b) => b.id))

  const renderBadge = ({ item }: { item: (typeof BADGES)[0] }) => {
    const isUnlocked = unlockedIds.has(item.id)
    const unlockedBadge = unlockedBadges.find((b) => b.id === item.id)

    return (
      <View style={[styles.badgeContainer, !isUnlocked && styles.badgeContainerLocked]}>
        <Text style={styles.badgeEmoji}>{item.emoji}</Text>
        <Text style={[styles.badgeTitle, !isUnlocked && styles.badgeTitleLocked]}>
          {item.title}
        </Text>
        {isUnlocked && unlockedBadge && (
          <Text style={styles.unlockedDate}>
            {new Date(unlockedBadge.unlockedAt).toLocaleDateString('he-IL')}
          </Text>
        )}
        {!isUnlocked && <Text style={styles.lockedText}>נעול</Text>}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>הצגות שלי</Text>
      <FlatList
        data={BADGES}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderBadge}
        scrollEnabled={false}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'right',
    marginBottom: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12,
  },
  badgeContainer: {
    flex: 0.48,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#81ecff',
  },
  badgeContainerLocked: {
    borderColor: '#444444',
    opacity: 0.6,
  },
  badgeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeTitleLocked: {
    color: '#666666',
  },
  unlockedDate: {
    fontSize: 12,
    color: '#81ecff',
    textAlign: 'center',
  },
  lockedText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
})
