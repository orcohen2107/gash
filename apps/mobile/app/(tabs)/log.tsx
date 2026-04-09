import React, { useRef, useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { LogBottomSheet } from '@/components/log/LogBottomSheet'
import { useLogStore } from '@/stores/useLogStore'

export default function LogScreen() {
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = [90]
  const { loadApproaches } = useLogStore()

  useEffect(() => {
    loadApproaches()
  }, [loadApproaches])

  const handleOpenSheet = () => {
    bottomSheetRef.current?.present()
  }

  return (
    <BottomSheetModalProvider>
      <View style={styles.container}>
        <Text style={styles.title}>רשום גישה</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>אין לך רישומים עדיין</Text>
          <Text style={styles.emptyStateSubtext}>לחץ על + בתחתית לרשם גישה חדשה</Text>
        </View>

        <Pressable style={styles.fab} onPress={handleOpenSheet}>
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
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingTop: 20,
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
    bottom: 24,
    right: 24,
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
