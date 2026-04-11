import { Pressable, StyleSheet, ActivityIndicator, ViewStyle, StyleProp } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { getExpoSpeechRecognitionModule } from '@/lib/getExpoSpeechRecognitionModule'
import { useSpeechToTextField } from '@/lib/useSpeechToTextField'

const MIC = '#81ecff'
const MIC_ACTIVE = '#ff716c'

const speech = getExpoSpeechRecognitionModule()

type Props = {
  /** ערך השדה הנוכחי — בתחילת הקלטה נשמר כבסיס; התמלול ממלא מחדש (כולל ביניים) כמו במאמן */
  value: string
  onChangeText: (text: string) => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * כפתור מיקרופון לשדות טקסט בטופס תיעוד — אותה לוגיקה כמו שורת הקלט במאמן (עברית, תוצאות ביניים).
 * ב‑Expo Go: Toast הסבר; עם מודול native — מלא.
 */
export function SpeechToTextButton({ value, onChangeText, disabled = false, style }: Props) {
  const { isListening, toggleSpeech } = useSpeechToTextField(value, onChangeText, disabled)

  return (
    <Pressable
      onPress={() => void toggleSpeech()}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        isListening && styles.btnActive,
        !speech && styles.btnDisabled,
        disabled && styles.btnDisabled,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityLabel={isListening ? 'עצור תמלול' : 'תמלול מדיבור'}
    >
      {isListening ? (
        <ActivityIndicator size="small" color={MIC_ACTIVE} />
      ) : (
        <MaterialIcons
          name="mic"
          size={22}
          color={!speech || disabled ? '#adaaaa' : MIC}
        />
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(32, 32, 31, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(129, 236, 255, 0.35)',
  },
  btnActive: {
    borderColor: 'rgba(255, 113, 108, 0.6)',
    backgroundColor: 'rgba(255, 113, 108, 0.12)',
  },
  btnDisabled: {
    opacity: 0.65,
  },
  pressed: {
    opacity: 0.88,
  },
})
