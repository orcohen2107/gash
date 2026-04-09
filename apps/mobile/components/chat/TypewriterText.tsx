import { useEffect, useRef, useState } from 'react'
import { Text, StyleSheet } from 'react-native'

const DEFAULT_SPEED_MS = 45

interface TypewriterTextProps {
  content: string
  speed?: number
  style?: object
}

export function TypewriterText({ content, speed = DEFAULT_SPEED_MS, style }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const indexRef = useRef(0)

  useEffect(() => {
    setDisplayedText('')
    indexRef.current = 0

    intervalRef.current = setInterval(() => {
      const nextIndex = indexRef.current + 1
      setDisplayedText(content.slice(0, nextIndex))
      indexRef.current = nextIndex

      if (nextIndex >= content.length && intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }, speed)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [content, speed])

  return <Text style={[styles.text, style]}>{displayedText}</Text>
}

const styles = StyleSheet.create({
  text: {
    color: '#0d2123',
    fontSize: 16,
    lineHeight: 26,
    fontFamily: 'Inter',
    textAlign: 'right',
  },
})
