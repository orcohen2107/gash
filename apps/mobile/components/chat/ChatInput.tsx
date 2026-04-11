import { Pressable, StyleSheet, View, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Input from '@/components/ui/Input'

const SEND_BUTTON_SIZE = 48

interface ChatInputProps {
  value: string
  onChangeText: (text: string) => void
  onSend: () => void
  disabled?: boolean
}

export function ChatInput({ value, onChangeText, onSend, disabled = false }: ChatInputProps) {
  const isSendDisabled = disabled || value.trim().length === 0

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <Input
          value={value}
          onChangeText={onChangeText}
          placeholder="כתוב הודעה..."
          returnKeyType="send"
          onSubmitEditing={onSend}
          editable={!disabled}
          multiline={false}
        />
      </View>
      <Pressable
        onPress={onSend}
        disabled={isSendDisabled}
        style={[styles.sendButton, isSendDisabled && styles.sendButtonDisabled]}
        hitSlop={8}
      >
        <LinearGradient
          colors={isSendDisabled ? ['#444444', '#333333'] : ['#81ecff', '#00d4ec']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sendGradient}
        >
          <Text style={[styles.sendIcon, { transform: [{ scaleX: -1 }] }]}>{'→'}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#161616',
  },
  inputWrapper: {
    flex: 1,
    marginEnd: 12,
  },
  sendButton: {
    width: SEND_BUTTON_SIZE,
    height: SEND_BUTTON_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: '700',
  },
})
