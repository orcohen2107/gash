import React, { useState } from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export interface ButtonProps {
  onPress: () => void
  title: string
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
}

const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  disabled = false,
  loading = false,
  style,
}) => {
  const [isPressed, setIsPressed] = useState(false)

  const handlePressIn = () => {
    setIsPressed(true)
  }

  const handlePressOut = () => {
    setIsPressed(false)
  }

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress()
    }
  }

  const opacity = isPressed && !disabled ? 0.8 : 1

  return (
    <TouchableOpacity
      style={[styles.container, { opacity }, style]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#81ecff', '#00d4ec']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.title}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
})

export default Button
