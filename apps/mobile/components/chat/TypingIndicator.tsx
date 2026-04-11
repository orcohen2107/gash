import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated'

const DOT_SIZE = 6
const DOT_CYCLE_MS = 600
const DOT_RISE_MS = 300
const DOT_FALL_MS = 300
const DOT_OPACITY_MIN = 0.35
const DOT_OPACITY_MAX = 1
const DOT_COLOR = '#adaaaa'

interface DotProps {
  delay: number
}

function Dot({ delay }: DotProps) {
  const opacity = useSharedValue(DOT_OPACITY_MIN)

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(DOT_OPACITY_MAX, { duration: DOT_RISE_MS }),
          withTiming(DOT_OPACITY_MIN, { duration: DOT_FALL_MS })
        ),
        -1
      )
    }, delay)

    return () => clearTimeout(timer)
  }, [delay, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[
        styles.dot,
        animatedStyle,
      ]}
    />
  )
}

export function TypingIndicator() {
  return (
    <View style={styles.container}>
      <Dot delay={0} />
      <Dot delay={DOT_CYCLE_MS / 3} />
      <Dot delay={(DOT_CYCLE_MS / 3) * 2} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: DOT_COLOR,
  },
})
