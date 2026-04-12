import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  ListRenderItemInfo,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import Toast from 'react-native-toast-message'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import { useChatStore } from '@/stores/useChatStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { analytics } from '@/lib/analytics'
import type { ChatMessage } from '@gash/types'

const TYPING_ITEM: ChatMessage = {
  id: '__typing__',
  user_id: '',
  role: 'assistant',
  content: '',
  created_at: '',
}

export default function CoachScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const userProfile = useAuthStore((s) => s.userProfile)
  const messages = useChatStore((s) => s.messages)
  const loading = useChatStore((s) => s.loading)
  const loadingMore = useChatStore((s) => s.loadingMore)
  const hasMoreHistory = useChatStore((s) => s.hasMoreHistory)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const loadHistory = useChatStore((s) => s.loadHistory)
  const loadOlderHistory = useChatStore((s) => s.loadOlderHistory)
  const clearHistory = useChatStore((s) => s.clearHistory)
  const flatListRef = useRef<FlatList<ChatMessage>>(null)
  const skipNextAutoScrollRef = useRef(false)
  const [inputValue, setInputValue] = useState('')

  useFocusEffect(
    useCallback(() => {
      analytics.trackScreenView('coach')
    }, [])
  )

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleSend = useCallback(async () => {
    const text = inputValue.trim()
    if (!text) return
    setInputValue('')
    analytics.trackMessageSent(text.length)
    await sendMessage(text)
  }, [inputValue, sendMessage])

  const handleCopy = useCallback(async (content: string) => {
    await Clipboard.setStringAsync(content)
    Toast.show({ type: 'success', text1: 'הועתק!', visibilityTime: 2000 })
  }, [])

  const handleLoadOlder = useCallback(async () => {
    skipNextAutoScrollRef.current = true
    await loadOlderHistory()
  }, [loadOlderHistory])

  const handleClearHistory = useCallback(() => {
    if (messages.length === 0 || loading) return

    Alert.alert(
      'למחוק את היסטוריית השיחה?',
      'הפעולה תמחק את כל ההודעות שנשמרו לחשבון שלך.',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: () => {
            void clearHistory()
          },
        },
      ]
    )
  }, [clearHistory, loading, messages.length])

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChatMessage>) => {
      if (item.id === '__typing__') {
        return <ChatBubble role="assistant" content="" isTyping />
      }
      return (
        <ChatBubble
          role={item.role}
          content={item.content}
          createdAt={item.created_at}
          onLongPress={item.role === 'assistant' ? () => handleCopy(item.content) : undefined}
        />
      )
    },
    [handleCopy]
  )

  const keyExtractor = useCallback((item: ChatMessage) => item.id, [])

  const data = loading ? [...messages, TYPING_ITEM] : messages

  const listHeader = useCallback(
    () => (
      <View>
        {hasMoreHistory && (
          <Pressable
            onPress={handleLoadOlder}
            disabled={loadingMore}
            style={({ pressed }) => [
              styles.loadMoreHistoryButton,
              pressed && styles.loadMoreHistoryButtonPressed,
              loadingMore && styles.loadMoreHistoryButtonDisabled,
            ]}
            accessibilityLabel="טען הודעות ישנות"
          >
            <Text style={styles.loadMoreHistoryText}>
              {loadingMore ? 'טוען הודעות...' : 'טען הודעות ישנות'}
            </Text>
          </Pressable>
        )}
        <View style={styles.datePillWrap}>
          <View style={styles.datePill}>
            <Text style={styles.datePillText}>היום</Text>
          </View>
        </View>
      </View>
    ),
    [handleLoadOlder, hasMoreHistory, loadingMore]
  )

  const handleContentSizeChange = useCallback(() => {
    if (skipNextAutoScrollRef.current) {
      skipNextAutoScrollRef.current = false
      return
    }
    flatListRef.current?.scrollToEnd({ animated: true })
  }, [])

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {/* RTL: סדר [הגדרות | כותרת | אווטאר] → הגדרות ימין, אווטאר שמאל */}
        <Pressable
          onPress={handleClearHistory}
          hitSlop={12}
          style={({ pressed }) => [
            styles.headerSlot,
            styles.iconBtn,
            messages.length === 0 && styles.iconBtnDisabled,
            pressed && styles.iconBtnPressed,
          ]}
          disabled={messages.length === 0 || loading}
          accessibilityLabel="מחיקת היסטוריית שיחה"
        >
          <MaterialIcons name="delete-outline" size={24} color="#81ecff" />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>מאמן שלך 🎯</Text>
          <Text style={styles.headerSubtitle}>אני כאן כדי לעזור</Text>
        </View>
        <Pressable
          onPress={() => router.push('/profile?from=coach')}
          style={({ pressed }) => [
            styles.headerSlot,
            styles.avatarOuter,
            pressed && styles.iconBtnPressed,
          ]}
          accessibilityLabel="תמונת פרופיל"
        >
          {userProfile?.avatar_url ? (
            <Image
              source={{ uri: userProfile.avatar_url }}
              style={styles.avatarImg}
              accessibilityLabel="תמונת פרופיל"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="person" size={20} color="#adaaaa" />
            </View>
          )}
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        scrollIndicatorInsets={{ right: 1 }}
        onContentSizeChange={handleContentSizeChange}
        style={styles.list}
      />

      <View style={styles.inputBar}>
        <ChatInput
          value={inputValue}
          onChangeText={setInputValue}
          onSend={handleSend}
          disabled={loading}
        />
      </View>

      <Toast />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0e0e0e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
    backgroundColor: '#0e0e0e',
    gap: 8,
  },
  headerSlot: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#81ecff',
    textAlign: 'center',
    letterSpacing: -0.5,
    fontFamily: 'Inter',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '500',
    color: '#adaaaa',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  iconBtn: {
    padding: 4,
  },
  iconBtnPressed: {
    opacity: 0.7,
  },
  iconBtnDisabled: {
    opacity: 0.35,
  },
  avatarOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(72, 72, 71, 0.35)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  datePillWrap: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  loadMoreHistoryButton: {
    alignSelf: 'center',
    minHeight: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#131313',
    borderWidth: 1,
    borderColor: 'rgba(129, 236, 255, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadMoreHistoryButtonPressed: {
    opacity: 0.8,
  },
  loadMoreHistoryButtonDisabled: {
    opacity: 0.55,
  },
  loadMoreHistoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#81ecff',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  datePill: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#131313',
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#adaaaa',
    letterSpacing: 0.5,
    fontFamily: 'Inter',
  },
  inputBar: {
    paddingBottom: 0,
  },
})
