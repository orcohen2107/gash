import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useLogStore } from '@/stores/useLogStore'
import type { Approach } from '@gash/types'
import JournalListItem from '@/components/journal/JournalListItem'
import ApproachDetailScreen from '@/components/journal/ApproachDetailScreen'

const APPROACH_TYPES = [
  { label: 'ישיר', value: 'direct' },
  { label: 'סיטואטיבי', value: 'situational' },
  { label: 'הומור', value: 'humor' },
  { label: 'אונליין', value: 'online' },
]

export default function JournalScreen() {
  const { approaches } = useLogStore()
  const [selectedApproach, setSelectedApproach] = useState<Approach | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Filter state
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [showDateRangeModal, setShowDateRangeModal] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [pickingStart, setPickingStart] = useState(false)

  // Filter approaches
  const filteredApproaches = useMemo(() => {
    return approaches.filter((approach) => {
      // Filter by type
      if (selectedType && approach.approach_type !== selectedType) return false

      // Filter by search (location)
      if (searchText && !approach.location?.toLowerCase().includes(searchText.toLowerCase())) {
        return false
      }

      // Filter by date range
      const approachDate = new Date(approach.date)
      if (startDate && approachDate < startDate) return false
      if (endDate) {
        const endOfDay = new Date(endDate)
        endOfDay.setHours(23, 59, 59, 999)
        if (approachDate > endOfDay) return false
      }

      return true
    })
  }, [approaches, selectedType, searchText, startDate, endDate])

  const handleDateChange = (event: any, date?: Date) => {
    if (pickingStart) {
      if (date) setStartDate(date)
      setPickingStart(false)
    } else {
      if (date) setEndDate(date)
      setShowDateRangeModal(false)
    }
  }

  const handleSelectApproach = (approach: Approach) => {
    setSelectedApproach(approach)
    setShowDetailModal(true)
  }

  const handleClearFilters = () => {
    setSelectedType(null)
    setSearchText('')
    setStartDate(null)
    setEndDate(null)
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>היומן שלי</Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Type pills */}
        <View style={styles.typeFilterContainer}>
          {APPROACH_TYPES.map((type) => (
            <Pressable
              key={type.value}
              style={[
                styles.typePill,
                selectedType === type.value && styles.typePillActive,
              ]}
              onPress={() =>
                setSelectedType(selectedType === type.value ? null : type.value)
              }
            >
              <Text
                style={[
                  styles.typePillText,
                  selectedType === type.value && styles.typePillTextActive,
                ]}
              >
                {type.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Date range button */}
        <Pressable
          style={styles.dateRangeButton}
          onPress={() => {
            setPickingStart(true)
            setShowDateRangeModal(true)
          }}
        >
          <Text style={styles.dateRangeButtonText}>
            {startDate ? `${startDate.toLocaleDateString('he-IL')}` : 'בחר תאריכים'}
          </Text>
        </Pressable>

        {/* Search input */}
        <TextInput
          style={styles.searchInput}
          placeholder="חיפוש לפי מיקום..."
          placeholderTextColor="#adaaaa"
          value={searchText}
          onChangeText={setSearchText}
          textAlign="right"
        />

        {/* Clear filters button */}
        {(selectedType || searchText || startDate || endDate) && (
          <Pressable style={styles.clearButton} onPress={handleClearFilters}>
            <Text style={styles.clearButtonText}>נקה מסננים</Text>
          </Pressable>
        )}
      </View>

      {/* Date picker modal */}
      {showDateRangeModal && (
        <DateTimePicker
          value={pickingStart ? startDate || new Date() : endDate || new Date()}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* List or empty state */}
      {filteredApproaches.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>אין רישומים</Text>
          <Text style={styles.emptyStateSubtext}>
            {approaches.length === 0
              ? 'התחל לתעד גישות כדי לראות אותן כאן'
              : 'אין גישות המתאימות למסננים'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredApproaches.filter(
            (a) => a.location && a.chemistry_score !== null
          )}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <JournalListItem
              approach={item as Approach}
              onPress={() => handleSelectApproach(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      )}

      {/* Detail modal */}
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
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  typeFilterContainer: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#20201f',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typePillActive: {
    backgroundColor: '#81ecff',
    borderColor: '#81ecff',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#adaaaa',
    textAlign: 'center',
  },
  typePillTextActive: {
    color: '#000000',
  },
  dateRangeButton: {
    backgroundColor: '#20201f',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  dateRangeButtonText: {
    color: '#ffffff',
    textAlign: 'right',
    fontSize: 14,
  },
  searchInput: {
    backgroundColor: '#20201f',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    borderRadius: 4,
    fontSize: 14,
  },
  clearButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  clearButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#adaaaa',
    textAlign: 'center',
  },
})
