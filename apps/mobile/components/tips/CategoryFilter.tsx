import React from 'react'
import { View, Pressable, Text, StyleSheet, ScrollView } from 'react-native'
import type { Tip } from '@gash/constants'
import { useHorizontalGutter } from '@/lib/responsiveLayout'

/** ערכי סינון פנימיים — תוויות במוקאפ: הכל, גישה, שיחה, ביטחון */
export type TipsFilterValue = 'all' | Tip['category']

interface CategoryFilterProps {
  selectedCategory: TipsFilterValue
  onSelectCategory: (category: TipsFilterValue) => void
}

const FILTERS: Array<{ label: string; value: TipsFilterValue }> = [
  { label: 'הכל', value: 'all' },
  { label: 'גישה', value: 'זיהוי' },
  { label: 'שיחה', value: 'אישור' },
  { label: 'ביטחון', value: 'ביטחון' },
]

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const gutter = useHorizontalGutter()
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, { paddingHorizontal: gutter }]}
      scrollEventThrottle={16}
    >
      {FILTERS.map((item) => (
        <Pressable
          key={item.value}
          onPress={() => onSelectCategory(item.value)}
          style={[
            styles.button,
            selectedCategory === item.value && styles.buttonActive,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              selectedCategory === item.value && styles.buttonTextActive,
            ]}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    gap: 12,
    flexDirection: 'row',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#20201f',
  },
  buttonActive: {
    backgroundColor: '#81ecff',
  },
  buttonText: {
    color: '#adaaaa',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonTextActive: {
    color: '#003840',
    fontWeight: '700',
  },
})
