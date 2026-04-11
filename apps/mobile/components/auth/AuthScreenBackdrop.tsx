import React from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg'

/** רקע מסך אימות: surface + אורות רכים (כמו ב־HTML Digital Architect) */
const SURFACE = '#0e0e0e'

export type AuthBackdropVariant = 'default' | 'welcome'

type AuthScreenBackdropProps = {
  /** welcome = אורות עדינים (5%) + רשת נקודות כמו מסך הפתיחה */
  variant?: AuthBackdropVariant
}

export function AuthScreenBackdrop({ variant = 'default' }: AuthScreenBackdropProps) {
  const { width, height } = useWindowDimensions()

  if (variant === 'welcome') {
    const orbL = Math.min(width, height) * 0.5
    const orbR = Math.min(width, height) * 0.6
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.base, StyleSheet.absoluteFill]} />
        <View
          style={[
            styles.orbWelcomePrimary,
            {
              width: orbL,
              height: orbL,
              borderRadius: orbL / 2,
              top: -height * 0.1,
              end: -width * 0.1,
            },
          ]}
        />
        <View
          style={[
            styles.orbWelcomeTertiary,
            {
              width: orbR,
              height: orbR,
              borderRadius: orbR / 2,
              bottom: -height * 0.1,
              start: -width * 0.1,
            },
          ]}
        />
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <Pattern id="welcomeDots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <Circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.02)" />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#welcomeDots)" />
        </Svg>
      </View>
    )
  }

  const orb = Math.min(width, height) * 0.52
  const orbSm = orb * 0.82

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.base, StyleSheet.absoluteFill]} />
      <View
        style={[
          styles.orbPrimary,
          {
            width: orb,
            height: orb,
            borderRadius: orb / 2,
            top: -height * 0.1,
            end: -width * 0.1,
          },
        ]}
      />
      <View
        style={[
          styles.orbTertiary,
          {
            width: orbSm,
            height: orbSm,
            borderRadius: orbSm / 2,
            bottom: -height * 0.05,
            start: -width * 0.05,
          },
        ]}
      />
    </View>
  )
}

export const authSurfaceColor = SURFACE

const styles = StyleSheet.create({
  base: {
    backgroundColor: SURFACE,
  },
  orbPrimary: {
    position: 'absolute',
    backgroundColor: 'rgba(129, 236, 255, 0.1)',
  },
  orbTertiary: {
    position: 'absolute',
    backgroundColor: 'rgba(162, 170, 255, 0.06)',
  },
  orbWelcomePrimary: {
    position: 'absolute',
    backgroundColor: 'rgba(129, 236, 255, 0.05)',
  },
  orbWelcomeTertiary: {
    position: 'absolute',
    backgroundColor: 'rgba(162, 170, 255, 0.05)',
  },
})
