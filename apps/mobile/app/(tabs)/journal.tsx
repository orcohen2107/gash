import React, { useCallback, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  useWindowDimensions,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useLogStore } from '@/stores/useLogStore'
import { analytics } from '@/lib/analytics'
import type { Approach, ApproachType } from '@gash/types'
import JournalListItem from '@/components/journal/JournalListItem'
import ApproachDetailScreen from '@/components/journal/ApproachDetailScreen'
import { AppTopBar } from '@/components/layout/AppTopBar'
import { horizontalGutter } from '@/lib/responsiveLayout'

type FilterValue = ApproachType | null

// ב-RTL עם row-reverse, הפריט האחרון במערך מופיע ראשון (ימין) — הכל צריך להיות ראשון ויזואלית
const FILTERS: { key: string; label: string; value: FilterValue }[] = [
  { key: 'online', label: 'אונליין', value: 'online' },
  { key: 'humor', label: 'הומור', value: 'humor' },
  { key: 'situational', label: 'מצבית', value: 'situational' },
  { key: 'direct', label: 'ישירה', value: 'direct' },
  { key: 'all', label: 'הכל', value: null },
]

const BG = '#0e0e0e'
const SURFACE_HIGH = '#20201f'
const ON_SURFACE = '#ffffff'
const ON_VARIANT = '#adaaaa'
const PRIMARY = '#81ecff'
const GRADIENT_END = '#00d4ec'
const ON_PRIMARY_FIXED = '#003840'
const GLASS_BG = 'rgba(38, 38, 38, 0.88)'
const OUTLINE_15 = 'rgba(72, 72, 71, 0.15)'

function approachMatchesSearch(approach: Approach, q: string): boolean {
  if (!q.trim()) return true
  const needle = q.trim().toLowerCase()
  const parts = [approach.location, approach.opener, approach.notes, approach.response]
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
    .map((s) => s.toLowerCase())
  return parts.some((s) => s.includes(needle))
}

export default function JournalScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const gutter = horizontalGutter(width)
  const tabBarHeight = useBottomTabBarHeight()
  const { approaches, loading, loadApproaches, loadMoreApproaches, hasMore, loadingMore } = useLogStore()
  const [selectedApproach, setSelectedApproach] = useState<Approach | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [selectedType, setSelectedType] = useState<FilterValue>(null)
  const [searchText, setSearchText] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  useFocusEffect(
    useCallback(() => {
      analytics.trackScreenView('journal')
      void loadApproaches()
    }, [loadApproaches])
  )

  const filteredApproaches = useMemo(() => {
    return approaches.filter((approach) => {
      if (selectedType && approach.approach_type !== selectedType) return false
      if (searchText && !approachMatchesSearch(approach, searchText)) {
        return false
      }
      return true
    })
  }, [approaches, selectedType, searchText])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadApproaches()
    setRefreshing(false)
  }, [loadApproaches])

  const handleSelectApproach = (approach: Approach) => {
    setSelectedApproach(approach)
    setShowDetailModal(true)
  }

  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      {
        paddingHorizontal: gutter,
        paddingBottom: tabBarHeight + 24,
      },
    ],
    [gutter, tabBarHeight]
  )

  const listHeader = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <View style={styles.searchWrap}>
          <TextInput
            style={[
              styles.searchInput,
              searchFocused && styles.searchInputFocused,
            ]}
            placeholder="חיפוש במיקום, פתיחה והערות"
            placeholderTextColor={ON_VARIANT}
            value={searchText}
            onChangeText={setSearchText}
            textAlign="right"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
            clearButtonMode="never"
          />
          {searchText.length > 0 ? (
            <Pressable
              style={styles.searchIcon}
              onPress={() => setSearchText('')}
              hitSlop={8}
              accessibilityLabel="נקה חיפוש"
            >
              <MaterialIcons name="cancel" size={20} color={ON_VARIANT} />
            </Pressable>
          ) : (
            <View style={styles.searchIcon} pointerEvents="none">
              <MaterialIcons name="search" size={22} color={ON_VARIANT} />
            </View>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((f) => {
            const selected =
              f.value === null
                ? selectedType === null
                : selectedType === f.value

            const label = (
              <Text
                style={
                  selected ? styles.filterTextActive : styles.filterTextIdle
                }
              >
                {f.label}
              </Text>
            )

            return (
              <Pressable
                key={f.key}
                onPress={() => {
                  if (f.value === null) setSelectedType(null)
                  else
                    setSelectedType(
                      selectedType === f.value ? null : f.value
                    )
                }}
                style={({ pressed }) => [
                  styles.filterPress,
                  pressed && { opacity: 0.88 },
                ]}
              >
                {selected ? (
                  <LinearGradient
                    colors={[PRIMARY, GRADIENT_END]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.filterPillGradient}
                  >
                    {label}
                  </LinearGradient>
                ) : (
                  <View style={styles.filterPillGlass}>{label}</View>
                )}
              </Pressable>
            )
          })}
        </ScrollView>
      </View>
    ),
    [searchText, searchFocused, selectedType]
  )

  const listFooter = useMemo(() => {
    if (!hasMore) return null

    return (
      <Pressable
        onPress={() => void loadMoreApproaches()}
        disabled={loadingMore}
        style={({ pressed }) => [
          styles.loadMoreButton,
          pressed && styles.loadMoreButtonPressed,
          loadingMore && styles.loadMoreButtonDisabled,
        ]}
      >
        <Text style={styles.loadMoreText}>
          {loadingMore ? 'טוען עוד...' : 'טען עוד גישות'}
        </Text>
      </Pressable>
    )
  }, [hasMore, loadMoreApproaches, loadingMore])

  const handleEndReached = useCallback(() => {
    void loadMoreApproaches()
  }, [loadMoreApproaches])

  // טעינה ראשונית — spinner מרכזי
  const isInitialLoad = loading && approaches.length === 0

  return (
    <View style={styles.container}>
      <AppTopBar from="journal" />

      {isInitialLoad ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : filteredApproaches.length === 0 ? (
        <ScrollView
          style={styles.emptyWrap}
          contentContainerStyle={styles.emptyScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={PRIMARY}
            />
          }
        >
          <View style={{ paddingHorizontal: gutter }}>{listHeader}</View>
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <MaterialIcons name="menu-book" size={48} color={ON_VARIANT} />
            </View>
            <Text style={styles.emptyStateText}>אין רישומים</Text>
            <Text style={styles.emptyStateSubtext}>
              {approaches.length === 0
                ? 'התחל לתעד גישות כדי לראות אותן כאן'
                : 'אין גישות המתאימות למסננים'}
            </Text>
            {approaches.length === 0 && (
              <Pressable
                onPress={() => router.push('/(tabs)/log')}
                style={({ pressed }) => [
                  styles.emptyCtaBtn,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
              >
                <LinearGradient
                  colors={[PRIMARY, GRADIENT_END]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyCtaGradient}
                >
                  <MaterialIcons name="add" size={20} color={ON_PRIMARY_FIXED} />
                  <Text style={styles.emptyCtaText}>תעד גישה עכשיו</Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredApproaches}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          renderItem={({ item, index }) => (
            <JournalListItem
              approach={item}
              listIndex={index}
              onPress={() => handleSelectApproach(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          contentContainerStyle={listContentStyle}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={PRIMARY}
            />
          }
        />
      )}

      {selectedApproach && (
        <ApproachDetailScreen
          approach={selectedApproach}
          visible={showDetailModal}
          onDismiss={() => {
            setShowDetailModal(false)
            setSelectedApproach(null)
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  headerBlock: {
    paddingBottom: 8,
    gap: 24,
    marginBottom: 8,
  },
  searchWrap: {
    position: 'relative',
  },
  searchInput: {
    width: '100%',
    backgroundColor: SURFACE_HIGH,
    borderWidth: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minHeight: 56,
    paddingVertical: 12,
    paddingStart: 16,
    paddingEnd: 48,
    fontSize: 18,
    fontWeight: '500',
    color: ON_SURFACE,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  searchInputFocused: {
    borderBottomColor: PRIMARY,
  },
  searchIcon: {
    position: 'absolute',
    end: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterScroll: {
    flexDirection: 'row-reverse',
    gap: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
  filterPress: {
    flexShrink: 0,
  },
  filterPillGradient: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPillGlass: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: OUTLINE_15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: ON_PRIMARY_FIXED,
    textAlign: 'center',
  },
  filterTextIdle: {
    fontSize: 14,
    fontWeight: '500',
    color: ON_VARIANT,
    textAlign: 'center',
  },
  listContent: {
    paddingTop: 8,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreButton: {
    alignSelf: 'center',
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: SURFACE_HIGH,
    borderWidth: 1,
    borderColor: OUTLINE_15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadMoreButtonPressed: {
    opacity: 0.86,
  },
  loadMoreButtonDisabled: {
    opacity: 0.55,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
    textAlign: 'center',
  },
  emptyWrap: {
    flex: 1,
  },
  emptyScrollContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 12,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SURFACE_HIGH,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    color: ON_SURFACE,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: ON_VARIANT,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCtaBtn: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  emptyCtaText: {
    fontSize: 16,
    fontWeight: '700',
    color: ON_PRIMARY_FIXED,
  },
})
