import React from 'react'
import { View, TextInput, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useHorizontalGutter } from '@/lib/responsiveLayout'

interface SearchInputProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
}

export default function SearchInput({
  value,
  onChangeText,
  placeholder = 'חיפוש טיפים, טכניקות...',
}: SearchInputProps) {
  const gutter = useHorizontalGutter()
  return (
    <View style={[styles.wrap, { marginHorizontal: gutter }]}>
      <MaterialIcons
        name="search"
        size={22}
        color="#adaaaa"
        style={styles.icon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="rgba(173, 170, 170, 0.5)"
        value={value}
        onChangeText={onChangeText}
        textAlign="right"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
    position: 'relative',
    justifyContent: 'center',
  },
  icon: {
    position: 'absolute',
    end: 16,
    zIndex: 1,
    pointerEvents: 'none',
  },
  input: {
    paddingHorizontal: 16,
    paddingEnd: 48,
    paddingVertical: 12,
    backgroundColor: '#20201f',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 0,
  },
})
