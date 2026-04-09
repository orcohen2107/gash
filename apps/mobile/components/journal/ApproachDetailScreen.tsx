import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Alert } from 'react-native'
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import Toast from 'react-native-toast-message'
import type { Approach } from '@gash/types'
import { useLogStore } from '@/stores/useLogStore'

const APPROACH_TYPE_LABELS: Record<string, string> = {
  direct: 'ישיר',
  situational: 'סיטואטיבי',
  humor: 'הומור',
  online: 'אונליין',
}

const RESPONSE_LABELS: Record<string, string> = {
  positive: 'חיובית',
  neutral: 'ניטרלית',
  dismissive: 'שלילית',
}

const FOLLOW_UP_LABELS: Record<string, string> = {
  meeting: 'מפגש',
  text: 'הודעה',
  instagram: 'אינסטגרם',
  nothing: 'לא היה',
}

interface ApproachDetailScreenProps {
  approach: Approach
  visible: boolean
  onDismiss: () => void
}

export default function ApproachDetailScreen({
  approach,
  visible,
  onDismiss,
}: ApproachDetailScreenProps) {
  const { deleteApproach } = useLogStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const dateStr = new Date(approach.date).toLocaleDateString('he-IL')
  const typeLabel =
    APPROACH_TYPE_LABELS[approach.approach_type ?? ''] || approach.approach_type
  const responseLabel =
    RESPONSE_LABELS[approach.response ?? ''] || approach.response
  const followUpLabel =
    FOLLOW_UP_LABELS[approach.follow_up ?? ''] || approach.follow_up

  const handleDelete = async () => {
    setShowDeleteConfirm(false)
    try {
      await deleteApproach(approach.id)
      Toast.show({
        type: 'success',
        text1: 'הגישה נמחקה',
      })
      onDismiss()
    } catch (err) {
      console.error('Delete error:', err)
      Toast.show({
        type: 'error',
        text1: 'בעיה במחיקה',
        text2: 'נסה שוב',
      })
    }
  }

  const handleDeletePress = () => {
    Alert.alert(
      'מחק את הגישה?',
      'לא ניתן להחזיר את הגישה לאחר מחיקה',
      [
        { text: 'ביטול', onPress: () => {} },
        {
          text: 'מחק',
          onPress: handleDelete,
          style: 'destructive',
        },
      ]
    )
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onDismiss}>
              <Text style={styles.closeButton}>✕</Text>
            </Pressable>
            <Text style={styles.headerTitle}>פרטי הגישה</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Content */}
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {/* Date */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>תאריך</Text>
              <Text style={styles.fieldValue}>{dateStr}</Text>
            </View>

            {/* Location */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>מיקום</Text>
              <Text style={styles.fieldValue}>{approach.location || '—'}</Text>
            </View>

            {/* Approach Type */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>סוג גישה</Text>
              <Text style={styles.fieldValue}>{typeLabel}</Text>
            </View>

            {/* Opener */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>פתיחה</Text>
              <Text style={styles.fieldValue}>{approach.opener || '—'}</Text>
            </View>

            {/* Response */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>תגובה</Text>
              <Text style={styles.fieldValue}>{responseLabel}</Text>
            </View>

            {/* Chemistry Score */}
            {approach.chemistry_score !== null && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>כימיה</Text>
                <View style={styles.chemistryContainer}>
                  <View
                    style={[
                      styles.chemistryCircle,
                      {
                        backgroundColor:
                          approach.chemistry_score <= 3
                            ? '#ff6b6b'
                            : approach.chemistry_score <= 6
                              ? '#ffb700'
                              : '#00d9a3',
                      },
                    ]}
                  >
                    <Text style={styles.chemistryScore}>
                      {approach.chemistry_score}
                    </Text>
                  </View>
                  <Text style={styles.chemistryLabel}>/10</Text>
                </View>
              </View>
            )}

            {/* Follow-up */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>המשך</Text>
              <Text style={styles.fieldValue}>{followUpLabel}</Text>
            </View>

            {/* Notes */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>הערות</Text>
              <Text style={styles.fieldValue}>{approach.notes || '—'}</Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.button, styles.deleteButton]}
              onPress={handleDeletePress}
            >
              <Text style={styles.deleteButtonText}>מחק</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.closeButtonContainer]} onPress={onDismiss}>
              <Text style={styles.closeButtonContainerText}>סגור</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0e0e0e',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    fontSize: 20,
    color: '#adaaaa',
    fontWeight: '300',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#adaaaa',
    fontWeight: '600',
    textAlign: 'right',
  },
  fieldValue: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'right',
  },
  chemistryContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  chemistryCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chemistryScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  chemistryLabel: {
    fontSize: 14,
    color: '#adaaaa',
  },
  footer: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButtonContainer: {
    backgroundColor: '#81ecff',
  },
  closeButtonContainerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
})
