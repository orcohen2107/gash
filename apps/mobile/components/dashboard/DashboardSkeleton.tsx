import React, { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet, useWindowDimensions } from 'react-native'
import { horizontalGutter } from '@/lib/responsiveLayout'

// cardW must match dashboard.tsx: (width - 2*gutter - 16) / 2
// No extra padding here — the parent ScrollView already applies paddingHorizontal: gutter

function usePulse() {
  const anim = useRef(new Animated.Value(0.4)).current
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [anim])
  return anim
}

function Bone({
  width,
  height,
  radius = 10,
  opacity,
  style,
}: {
  width: number | string
  height: number
  radius?: number
  opacity: Animated.Value
  style?: object
}) {
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: '#262626',
          opacity,
        },
        style,
      ]}
    />
  )
}

export default function DashboardSkeleton() {
  const { width } = useWindowDimensions()
  const gutter = horizontalGutter(width)
  const cardW = (width - 2 * gutter - 16) / 2

  const p1 = usePulse()
  const p2 = usePulse()
  const p3 = usePulse()
  const p4 = usePulse()

  return (
    <View style={styles.container}>
      {/* WeeklySummaryCard */}
      <Bone width='100%' height={108} radius={12} opacity={p1} style={styles.gap} />

      {/* StreakNudgeCard */}
      <Bone width='100%' height={54} radius={12} opacity={p2} style={styles.gap} />

      {/* KPI 2×2 grid */}
      <View style={styles.grid}>
        <Bone width={cardW} height={112} radius={12} opacity={p1} />
        <Bone width={cardW} height={112} radius={12} opacity={p3} />
        <Bone width={cardW} height={112} radius={12} opacity={p2} />
        <Bone width={cardW} height={112} radius={12} opacity={p4} />
      </View>

      {/* LearningSummaryCard */}
      <Bone width='100%' height={168} radius={12} opacity={p3} style={styles.gap} />

      {/* SuccessBarChart header + bars */}
      <Bone width={160} height={22} radius={6} opacity={p2} style={styles.gap} />
      <Bone width='100%' height={12} radius={6} opacity={p1} style={styles.barGap} />
      <Bone width='80%' height={12} radius={6} opacity={p4} style={styles.barGap} />
      <Bone width='55%' height={12} radius={6} opacity={p2} style={styles.barGap} />
      <Bone width='35%' height={12} radius={6} opacity={p3} style={[styles.barGap, styles.extraBottom]} />

      {/* ChemistryLineChart shell */}
      <Bone width='100%' height={200} radius={12} opacity={p4} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 4,
  },
  gap: {
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    marginBottom: 16,
  },
  barGap: {
    marginBottom: 14,
  },
  extraBottom: {
    marginBottom: 28,
  },
})
