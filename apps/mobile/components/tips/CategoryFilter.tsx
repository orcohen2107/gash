import React from 'react'
import { View, Pressable, Text, StyleSheet, ScrollView } from 'react-native'
import type { Tip } from '@gash/constants'
import { TIP_CATEGORIES } from '@gash/constants'

interface CategoryFilterProps {
  selectedCategory: Tip['category'] | 'all'
  onSelectCategory: (category: Tip['category'] | 'all') => void
}

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const categories: Array<{ label: string; value: Tip['category'] | 'all' }> = [
    { label: 'כל', value: 'all' },
    { label: 'ביטחון', value: 'ביטחון' },
    { label: 'אישור', value: 'אישור' },
    { label: 'זיהוי', value: 'זיהוי' },
    { label: 'ליווי', value: 'ליווי' },
  ]

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      scrollEventThrottle={16}
    >
      {categories.map((category) => (
        <Pressable
          key={category.value}
          onPress={() => onSelectCategory(category.value as Tip['category'] | 'all')}
          style={[
            styles.button,
            selectedCategory === category.value && styles.buttonActive,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              selectedCategory === category.value && styles.buttonTextActive,
            ]}
          >
            {category.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444444',
    backgroundColor: 'transparent',
  },
  buttonActive: {
    backgroundColor: '#81ecff',
    borderColor: '#81ecff',
  },
  buttonText: {
    color: '#adaaaa',
    fontSize: 13,
    fontWeight: '500',
  },
  buttonTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
})
