import React, { useCallback, useRef } from 'react'
import { Pressable, Text, StyleSheet, ScrollView, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
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
  { label: 'פלירטוט', value: 'פלירטוט' },
  { label: 'ביטחון', value: 'ביטחון' },
]

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const gutter = useHorizontalGutter()
  const scrollRef = useRef<ScrollView>(null)
  const scrollToStart = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: false })
  }, [])

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollRtl}
        contentContainerStyle={[styles.container, { paddingHorizontal: gutter }]}
        onContentSizeChange={scrollToStart}
        onLayout={scrollToStart}
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
      <LinearGradient
        colors={['transparent', '#0e0e0e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.fadeEnd}
        pointerEvents="none"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  /** כיוון LTR + row-reverse: הצ׳יפים מתחילים מימין (הכל ראשון) ונגללים שמאלה */
  scrollRtl: {
    direction: 'ltr',
  },
  container: {
    paddingVertical: 4,
    gap: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
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
  fadeEnd: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    end: 0,
    width: 36,
    pointerEvents: 'none',
  },
})
