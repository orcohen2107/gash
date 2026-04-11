import React, { useRef, useEffect, useCallback } from 'react'
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { LogBottomSheet } from '@/components/log/LogBottomSheet'
import { AppTopBar } from '@/components/layout/AppTopBar'
import { useLogStore } from '@/stores/useLogStore'
import { analytics } from '@/lib/analytics'
import { horizontalGutter } from '@/lib/responsiveLayout'

export default function LogScreen() {
  const { width } = useWindowDimensions()
  const gutter = horizontalGutter(width)
  const titleSize = width < 360 ? 24 : 28
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = [90]
  const { loadApproaches } = useLogStore()

  // Track screen view
  useFocusEffect(
    useCallback(() => {
      analytics.trackScreenView('log')
    }, [])
  )

  useEffect(() => {
    loadApproaches()
    const unsubscribe = useLogStore.getState().subscribeToChanges()
    return unsubscribe
  }, [loadApproaches])

  const handleOpenSheet = () => {
    analytics.trackButtonClick('open_log_form', 'log')
    bottomSheetRef.current?.present()
  }

  return (
    <BottomSheetModalProvider>
      <View style={styles.container}>
        <AppTopBar from="log" />
        <Text style={[styles.title, { fontSize: titleSize }]}>רשום גישה</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>אין לך רישומים עדיין</Text>
          <Text style={styles.emptyStateSubtext}>לחץ על + בתחתית לרשם גישה חדשה</Text>
        </View>

        <Pressable
          /** bottom מחושב מתחתית אזור הטאב בלבד (מעל סרגל האייקונים) — לא מוסיפים tabBarHeight */
          style={[styles.fab, { bottom: 12, end: gutter }]}
          onPress={handleOpenSheet}
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      </View>

      <BottomSheetModal ref={bottomSheetRef} snapPoints={snapPoints} enablePanDownToClose>
        <LogBottomSheet />
      </BottomSheetModal>
    </BottomSheetModalProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
    position: 'relative',
  },
  title: {
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#adaaaa',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#81ecff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabIcon: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
  },
})
