import { Pressable, StyleSheet, Text } from 'react-native'
import Animated, { FadeInLeft, FadeInRight, Layout } from 'react-native-reanimated'
import { TypingIndicator } from './TypingIndicator'
import { TypewriterText } from './TypewriterText'

const USER_BG = '#20201f'
const AI_BG = '#00e3fd'
const AI_BG_OPACITY = 0.92

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
  isTyping?: boolean
  onLongPress?: () => void
}

export function ChatBubble({ role, content, isTyping = false, onLongPress }: ChatBubbleProps) {
  const isUser = role === 'user'

  return (
    <Animated.View
      entering={isUser ? FadeInRight.springify() : FadeInLeft.springify()}
      layout={Layout.springify()}
      style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperAssistant]}
    >
      <Pressable
        onLongPress={onLongPress}
        style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}
        delayLongPress={400}
      >
        {isTyping ? (
          <TypingIndicator />
        ) : isUser ? (
          <Text style={styles.textUser}>{content}</Text>
        ) : (
          <TypewriterText content={content} />
        )}
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
    maxWidth: '80%',
  },
  wrapperUser: {
    alignSelf: 'flex-end',
  },
  wrapperAssistant: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: USER_BG,
  },
  bubbleAssistant: {
    backgroundColor: AI_BG,
    opacity: AI_BG_OPACITY,
  },
  textUser: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 26,
    fontFamily: 'Inter',
    textAlign: 'right',
  },
})
