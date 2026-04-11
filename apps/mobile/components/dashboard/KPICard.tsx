import React, { type ComponentProps } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'

type Accent = 'primary' | 'tertiary' | 'secondary' | 'primaryGlow'

type IconName = ComponentProps<typeof MaterialIcons>['name']

const ACCENTS: Record<
  Accent,
  { border: string; icon: string; sub?: string }
> = {
  primary: { border: 'rgba(0, 212, 236, 0.35)', icon: '#00d4ec' },
  tertiary: { border: 'rgba(141, 150, 244, 0.35)', icon: '#8d96f4', sub: '#a2aaff' },
  secondary: { border: 'rgba(191, 216, 229, 0.35)', icon: '#bfd8e5', sub: '#cde6f4' },
  primaryGlow: { border: 'rgba(129, 236, 255, 0.35)', icon: '#81ecff' },
}

interface KPICardProps {
  label: string
  value: string | number
  icon: IconName
  accent: Accent
  /** טקסט קטן ליד הערך (אחוז שינוי, תווית מצב וכו׳) */
  subLabel?: string
  /** אייקון משני (למשל אימות ליד סוג גישה) */
  trailingIcon?: IconName
}

export default function KPICard({
  label,
  value,
  icon,
  accent,
  subLabel,
  trailingIcon,
}: KPICardProps) {
  const a = ACCENTS[accent]
  const bg =
    accent === 'primary' ? '#1a1a1a' : '#131313'

  return (
    <View style={[styles.container, { backgroundColor: bg, borderBottomColor: a.border }]}>
      <MaterialIcons name={icon} size={22} color={a.icon} style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {subLabel ? (
          <Text style={[styles.subLabel, a.sub ? { color: a.sub } : null]}>{subLabel}</Text>
        ) : null}
        {trailingIcon ? (
          <MaterialIcons name={trailingIcon} size={18} color="#81ecff" style={styles.trail} />
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 18,
    borderBottomWidth: 2,
    minHeight: 112,
  },
  icon: {
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    color: '#adaaaa',
    textAlign: 'right',
    fontWeight: '700',
    marginBottom: 6,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'flex-end',
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'right',
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#81ecff',
    paddingBottom: 3,
    marginStart: 4,
  },
  trail: {
    marginStart: 4,
    marginBottom: 2,
  },
})
