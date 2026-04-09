import React, { useState } from 'react'
import { TextInput, TextInputProps, View, StyleSheet } from 'react-native'

export interface InputProps extends Omit<TextInputProps, 'style'> {
  placeholder?: string
  value?: string
  onChangeText?: (text: string) => void
  secureTextEntry?: boolean
  keyboardType?: TextInputProps['keyboardType']
  onBlur?: () => void
  onFocus?: () => void
}

const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      placeholder,
      value,
      onChangeText,
      secureTextEntry = false,
      keyboardType = 'default',
      onBlur,
      onFocus,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)

    const handleFocus = () => {
      setIsFocused(true)
      onFocus?.()
    }

    const handleBlur = () => {
      setIsFocused(false)
      onBlur?.()
    }

    return (
      <View
        style={[
          styles.container,
          isFocused && styles.containerFocused,
        ]}
      >
        <TextInput
          ref={ref}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#adaaaa"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </View>
    )
  }
)

Input.displayName = 'Input'

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#20201f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  containerFocused: {
    borderBottomWidth: 2,
    borderBottomColor: '#81ecff',
  },
  input: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter',
    lineHeight: 24,
    textAlign: 'right',
    padding: 4,
  },
})

export default Input
