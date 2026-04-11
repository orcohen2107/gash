import { Pressable, StyleSheet, Text, View, I18nManager } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import Animated, { FadeInLeft, FadeInRight, Layout } from 'react-native-reanimated'
import { TypingIndicator } from './TypingIndicator'
import { TypewriterText } from './TypewriterText'

const SURFACE_HIGH = '#20201f'
const ON_SURFACE = '#ffffff'
const ON_SURFACE_VARIANT = '#adaaaa'
const ON_PRIMARY_FIXED = '#003840'
const AVATAR_AI_BG = 'rgba(129, 236, 255, 0.2)'
const AVATAR_USER_BG = '#334a55'
const SECONDARY_TEXT = '#cde6f4'

function formatChatTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
  isTyping?: boolean
  onLongPress?: () => void
}

export function ChatBubble({
  role,
  content,
  createdAt,
  isTyping = false,
  onLongPress,
}: ChatBubbleProps) {
  const isUser = role === 'user'
  const timeLabel = formatChatTime(createdAt ?? '')

  /** ב־RTL (כמו וואטסאפ בעברית): מאמן = ימין (flex-start), משתמש = שמאל (flex-end) */
  const rowJustify = isUser ? 'flex-end' : 'flex-start'

  if (isTyping) {
    return (
      <Animated.View
        entering={I18nManager.isRTL ? FadeInRight.springify() : FadeInLeft.springify()}
        layout={Layout.springify()}
        style={[styles.rowOuter, { justifyContent: rowJustify }]}
      >
        <View style={styles.rowInner}>
          <View style={[styles.avatarWrap, styles.avatarAi]}>
            <MaterialIcons name="smart-toy" size={16} color="#81ecff" />
          </View>
          <View style={styles.typingColumn}>
            <View style={styles.typingBubble}>
              <TypingIndicator />
            </View>
          </View>
        </View>
      </Animated.View>
    )
  }

  return (
    <Animated.View
      entering={
        isUser
          ? I18nManager.isRTL
            ? FadeInLeft.springify()
            : FadeInRight.springify()
          : I18nManager.isRTL
            ? FadeInRight.springify()
            : FadeInLeft.springify()
      }
      layout={Layout.springify()}
      style={[styles.rowOuter, { justifyContent: rowJustify }]}
    >
      {isUser ? (
        <View style={styles.rowInner}>
          <View style={styles.userTextColumn}>
            <Pressable
              onLongPress={onLongPress}
              delayLongPress={400}
              style={styles.userPressable}
            >
              <LinearGradient
                colors={['#81ecff', '#00d4ec']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bubbleUser}
              >
                <Text style={styles.textUser}>{content}</Text>
                {timeLabel ? (
                  <Text style={styles.timeUser}>{timeLabel}</Text>
                ) : null}
              </LinearGradient>
            </Pressable>
          </View>
          <View style={[styles.avatarWrap, styles.avatarUser]}>
            <MaterialIcons name="person" size={16} color={SECONDARY_TEXT} />
          </View>
        </View>
      ) : (
        <View style={styles.rowInner}>
          <View style={[styles.avatarWrap, styles.avatarAi]}>
            <MaterialIcons name="smart-toy" size={16} color="#81ecff" />
          </View>
          <View style={styles.aiColumn}>
            <Pressable
              onLongPress={onLongPress}
              style={[styles.bubbleAi, styles.bubbleAiPressable]}
              delayLongPress={400}
            >
              <TypewriterText content={content} textColor={ON_SURFACE} />
            </Pressable>
            {timeLabel ? <Text style={styles.timeAi}>{timeLabel}</Text> : null}
          </View>
        </View>
      )}
    </Animated.View>
  )
}

const BUBBLE_RADIUS = 16

const styles = StyleSheet.create({
  rowOuter: {
    width: '100%',
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowInner: {
    maxWidth: '85%',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAi: {
    backgroundColor: AVATAR_AI_BG,
    borderWidth: 1,
    borderColor: 'rgba(129, 236, 255, 0.3)',
    marginEnd: 12,
  },
  avatarUser: {
    backgroundColor: AVATAR_USER_BG,
    marginStart: 12,
  },
  aiColumn: {
    flexShrink: 1,
  },
  bubbleAi: {
    backgroundColor: SURFACE_HIGH,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BUBBLE_RADIUS,
    borderTopRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleAiPressable: {
    minWidth: 0,
  },
  timeAi: {
    fontSize: 9,
    color: ON_SURFACE_VARIANT,
    marginTop: 8,
    textAlign: 'right',
    fontFamily: 'Inter',
  },
  userTextColumn: {
    flexShrink: 1,
  },
  userPressable: {
    borderRadius: BUBBLE_RADIUS,
    overflow: 'hidden',
  },
  bubbleUser: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BUBBLE_RADIUS,
    borderTopLeftRadius: 0,
    shadowColor: '#81ecff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  textUser: {
    color: ON_PRIMARY_FIXED,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Inter',
    fontWeight: '600',
    textAlign: 'right',
  },
  timeUser: {
    fontSize: 9,
    color: 'rgba(0, 56, 64, 0.55)',
    marginTop: 8,
    textAlign: 'right',
    fontFamily: 'Inter',
  },
  typingColumn: {
    flexShrink: 1,
  },
  typingBubble: {
    backgroundColor: '#131313',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BUBBLE_RADIUS,
    borderTopRightRadius: 0,
  },
})
