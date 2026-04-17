import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { COACH_MODES } from '@gash/constants'
import type { CoachMode } from '@gash/types'

const C = {
  bg: '#0e0e0e',
  surface: '#131313',
  surfaceHigh: '#1c1c1b',
  onSurface: '#ffffff',
  onVariant: '#adaaaa',
  outline: 'rgba(72, 72, 71, 0.35)',
  primary: '#81ecff',
  primaryDim: '#00d4ec',
  onPrimary: '#003840',
}

interface ModeSelectorProps {
  userName?: string | null
  onSelect: (mode: CoachMode) => void
}

export function ModeSelector({ userName, onSelect }: ModeSelectorProps) {
  const greeting = userName ? `היי ${userName} 👋` : 'היי 👋'

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.question}>מה בא לך היום?</Text>
      </View>

      <View style={styles.cards}>
        {COACH_MODES.map((m) => (
          <ModeCard
            key={m.id}
            icon={m.icon}
            label={m.label}
            description={m.description}
            onPress={() => onSelect(m.id)}
          />
        ))}
      </View>
    </View>
  )
}

interface ModeCardProps {
  icon: string
  label: string
  description: string
  onPress: () => void
}

function ModeCard({ icon, label, description, onPress }: ModeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {({ pressed }) => (
        <>
          <View style={[styles.cardInner, pressed && styles.cardInnerActive]}>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{icon}</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardLabel}>{label}</Text>
              <Text style={styles.cardDesc}>{description}</Text>
            </View>
            <View style={styles.arrow}>
              <Text style={styles.arrowText}>←</Text>
            </View>
          </View>
          {pressed && (
            <LinearGradient
              colors={['rgba(129,236,255,0.08)', 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 0 }}
              pointerEvents="none"
            />
          )}
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: C.onSurface,
    textAlign: 'right',
    fontFamily: 'Inter',
    letterSpacing: -0.5,
  },
  question: {
    fontSize: 16,
    fontWeight: '500',
    color: C.onVariant,
    textAlign: 'right',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  cards: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.outline,
  },
  cardPressed: {
    borderColor: 'rgba(129, 236, 255, 0.4)',
  },
  cardInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 14,
  },
  cardInnerActive: {
    backgroundColor: 'rgba(129,236,255,0.04)',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  cardText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: C.onSurface,
    textAlign: 'right',
    fontFamily: 'Inter',
  },
  cardDesc: {
    fontSize: 12,
    fontWeight: '400',
    color: C.onVariant,
    textAlign: 'right',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  arrow: {
    opacity: 0.35,
  },
  arrowText: {
    fontSize: 18,
    color: C.primary,
  },
})
