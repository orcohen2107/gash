import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { View, ScrollView, StyleSheet, Text } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { TIPS } from '@gash/constants'
import type { Tip } from '@gash/constants'
import TipCard from '@/components/tips/TipCard'
import CategoryFilter from '@/components/tips/CategoryFilter'
import SearchInput from '@/components/tips/SearchInput'
import BadgeGallery from '@/components/badges/BadgeGallery'
import { useBadgesStore } from '@/stores/useBadgesStore'
import { analytics } from '@/lib/analytics'

export default function TipsScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Tip['category'] | 'all'>('all')
  const checkAndUnlockBadges = useBadgesStore((state) => state.checkAndUnlockBadges)

  // Track screen view
  useFocusEffect(
    useCallback(() => {
      analytics.trackScreenView('tips')
    }, [])
  )

  useEffect(() => {
    checkAndUnlockBadges()
  }, [checkAndUnlockBadges])

  const filteredTips = useMemo(() => {
    return TIPS.filter((tip) => {
      // Filter by category
      if (selectedCategory !== 'all' && tip.category !== selectedCategory) {
        return false
      }
      // Filter by search query (case-insensitive Hebrew)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        return (
          tip.title.toLowerCase().includes(query) ||
          tip.description.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [searchQuery, selectedCategory])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>טיפים</Text>
      </View>

      <SearchInput value={searchQuery} onChangeText={setSearchQuery} />

      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {filteredTips.length > 0 ? (
          filteredTips.map((tip) => <TipCard key={tip.id} tip={tip} />)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>לא נמצאו טיפים</Text>
          </View>
        )}
        <BadgeGallery />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#adaaaa',
    textAlign: 'center',
  },
})
