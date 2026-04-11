import React from 'react'
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native'
import type { Badge } from '@gash/constants'

type BadgeDetailModalProps = {
  visible: boolean
  badge: Badge | null
  isUnlocked: boolean
  unlockedAtLabel: string | null
  liveStatusLine: string
  onClose: () => void
}

export function BadgeDetailModal({
  visible,
  badge,
  isUnlocked,
  unlockedAtLabel,
  liveStatusLine,
  onClose,
}: BadgeDetailModalProps) {
  const { height } = useWindowDimensions()
  if (!badge) return null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="סגור">
        <Pressable
          style={[styles.sheet, { maxHeight: height * 0.88 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollInner}
            bounces={false}
          >
            <Text style={styles.emoji}>{badge.emoji}</Text>
            <Text style={styles.title}>{badge.title}</Text>
            <Text style={styles.kicker}>מה זה?</Text>
            <Text style={styles.body}>{badge.whatIs}</Text>

            <Text style={styles.kicker}>איך משיגים?</Text>
            <Text style={styles.body}>{badge.howToUnlock}</Text>

            {liveStatusLine ? (
              <>
                <Text style={styles.kicker}>המצב אצלך עכשיו</Text>
                <Text style={styles.statusLine}>{liveStatusLine}</Text>
              </>
            ) : null}

            {isUnlocked ? (
              <View style={styles.unlockedBanner}>
                <Text style={styles.unlockedTitle}>השגת את התג הזה</Text>
                {unlockedAtLabel ? (
                  <Text style={styles.unlockedDate}>נפתח בתאריך {unlockedAtLabel}</Text>
                ) : null}
                <Text style={styles.unlockedHint}>כל הכבוד — זה מחושב מהנתונים האמיתיים שלך באפליקציה.</Text>
              </View>
            ) : (
              <View style={styles.lockedHint}>
                <Text style={styles.lockedHintText}>
                  עדיין לא השגת את התג — המשך לתעד גישות; הסטטוס מתעדכן אוטומטית.
                </Text>
              </View>
            )}
          </ScrollView>

          <Pressable style={styles.closeBtn} onPress={onClose} accessibilityRole="button">
            <Text style={styles.closeBtnText}>סגור</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const BG = '#0e0e0e'
const ACCENT = '#81ecff'
const MUTED = '#adaaaa'

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scrollInner: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  emoji: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'right',
    marginBottom: 16,
    writingDirection: 'rtl',
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    color: ACCENT,
    textAlign: 'right',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    writingDirection: 'rtl',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#e8e8e8',
    textAlign: 'right',
    marginBottom: 16,
    writingDirection: 'rtl',
  },
  statusLine: {
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
    textAlign: 'right',
    marginBottom: 16,
    writingDirection: 'rtl',
  },
  unlockedBanner: {
    backgroundColor: 'rgba(129, 236, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(129, 236, 255, 0.35)',
    padding: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  unlockedTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: ACCENT,
    textAlign: 'right',
    marginBottom: 6,
    writingDirection: 'rtl',
  },
  unlockedDate: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'right',
    marginBottom: 8,
    writingDirection: 'rtl',
  },
  unlockedHint: {
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  lockedHint: {
    marginTop: 4,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  lockedHintText: {
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  closeBtn: {
    marginHorizontal: 20,
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: BG,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: ACCENT,
  },
})
