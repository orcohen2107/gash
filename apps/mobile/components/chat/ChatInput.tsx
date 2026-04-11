import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  TextInput,
  Platform,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useSpeechToTextField } from '@/lib/useSpeechToTextField'

const PRIMARY = '#81ecff'
const ON_PRIMARY_FIXED = '#003840'
const SURFACE_HIGH = '#20201f'
const MUTED = '#adaaaa'
const PLACEHOLDER = 'כתוב הודעה למאמן...'

const SEND_SIZE = 48
const MIC_SIZE = 40

interface ChatInputProps {
  value: string
  onChangeText: (text: string) => void
  onSend: () => void
  disabled?: boolean
}

export function ChatInput({ value, onChangeText, onSend, disabled = false }: ChatInputProps) {
  const isSendDisabled = disabled || value.trim().length === 0
  const { isListening, toggleSpeech } = useSpeechToTextField(value, onChangeText, disabled)
  const inputLocked = disabled || isListening

  return (
    <View style={styles.outer}>
      <View style={styles.bar}>
        <Pressable
          onPress={onSend}
          disabled={isSendDisabled}
          style={[styles.sendBtn, isSendDisabled && styles.sendBtnDisabled]}
          hitSlop={8}
        >
          <MaterialIcons
            name="send"
            size={22}
            color={isSendDisabled ? MUTED : ON_PRIMARY_FIXED}
            style={styles.sendIconFlip}
          />
        </Pressable>
        <TextInput
          style={styles.field}
          value={value}
          onChangeText={onChangeText}
          placeholder={isListening ? 'מקשיבים…' : PLACEHOLDER}
          placeholderTextColor="rgba(173, 170, 170, 0.5)"
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={onSend}
          editable={!inputLocked}
          multiline
          maxLength={4000}
          textAlignVertical="top"
        />
        <Pressable
          onPress={toggleSpeech}
          disabled={disabled}
          style={[styles.micBtn, disabled && styles.micBtnDisabled]}
          hitSlop={8}
          accessibilityLabel={isListening ? 'עצור הקלטה' : 'הקלט דיבור'}
        >
          {isListening ? (
            <ActivityIndicator size="small" color={PRIMARY} />
          ) : (
            <MaterialIcons name="mic" size={22} color={disabled ? MUTED : PRIMARY} />
          )}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 10,
    backgroundColor: 'rgba(14, 14, 14, 0.92)',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: SURFACE_HIGH,
    borderRadius: 16,
    padding: 8,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  sendBtn: {
    width: SEND_SIZE,
    height: SEND_SIZE,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  sendIconFlip: {
    transform: [{ scaleX: -1 }],
  },
  field: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#ffffff',
    textAlign: 'right',
  },
  micBtn: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnDisabled: {
    opacity: 0.45,
  },
})
