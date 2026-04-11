import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FlatList,
  KeyboardAvoidingView,
  ListRenderItemInfo,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Clipboard from 'expo-clipboard'
import Toast from 'react-native-toast-message'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import { useChatStore } from '@/stores/useChatStore'
import { analytics } from '@/lib/analytics'
import type { ChatMessage } from '@gash/types'

const BUBBLE_ESTIMATED_HEIGHT = 80

const TYPING_ITEM: ChatMessage = {
  id: '__typing__',
  user_id: '',
  role: 'assistant',
  content: '',
  created_at: '',
}

export default function CoachScreen() {
  const insets = useSafeAreaInsets()
  const messages = useChatStore((s) => s.messages)
  const loading = useChatStore((s) => s.loading)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const loadHistory = useChatStore((s) => s.loadHistory)
  const flatListRef = useRef<FlatList<ChatMessage>>(null)
  const [inputValue, setInputValue] = useState('')

  // Track screen view
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
    // Track message sent
    analytics.trackMessageSent(text.length)
    await sendMessage(text)
  }, [inputValue, sendMessage])

  const handleCopy = useCallback(async (content: string) => {
    await Clipboard.setStringAsync(content)
    Toast.show({ type: 'success', text1: 'הועתק!', visibilityTime: 2000 })
  }, [])

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChatMessage>) => {
      if (item.id === '__typing__') {
        return <ChatBubble role="assistant" content="" isTyping />
      }
      return (
        <ChatBubble
          role={item.role}
          content={item.content}
          onLongPress={item.role === 'assistant' ? () => handleCopy(item.content) : undefined}
        />
      )
    },
    [handleCopy]
  )

  const getItemLayout = useCallback(
    (_data: ArrayLike<ChatMessage> | null | undefined, index: number) => ({
      length: BUBBLE_ESTIMATED_HEIGHT,
      offset: BUBBLE_ESTIMATED_HEIGHT * index,
      index,
    }),
    []
  )

  const keyExtractor = useCallback((item: ChatMessage) => item.id, [])

  const data = loading ? [...messages, TYPING_ITEM] : messages

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>המאמן</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.listContent}
        scrollIndicatorInsets={{ right: 1 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        style={styles.list}
      />

      {/**
       * בלי paddingBottom מ-insets.bottom: בתוך טאבים אזור המסך כבר מסתיים *מעל* סרגל הטאב,
       * והוספת inset תחתון יוצרת רווח ענק בין שורת הקלט לטאב (כפל safe-area).
       */}
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#0e0e0e',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'right',
    fontFamily: 'Inter',
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    /** רק מרווח דק מעל שורת הקלט — לא גובה טאב (הקלט כבר מעל הטאב) */
    paddingBottom: 6,
  },
  inputBar: {
    paddingBottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
})
