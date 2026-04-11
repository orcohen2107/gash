import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import Toast from 'react-native-toast-message'
import { getExpoSpeechRecognitionModule } from '@/lib/getExpoSpeechRecognitionModule'

const LANG = 'he-IL'

const speech = getExpoSpeechRecognitionModule()

function androidApiLevel(): number {
  if (Platform.OS !== 'android') return 0
  const v = Platform.Version
  return typeof v === 'number' ? v : parseInt(String(v), 10) || 0
}

const EXPO_GO_SPEECH_MSG = {
  text1: 'זיהוי דיבור לא זמין בסביבה הזו',
  text2: 'ב‑Expo Go אין את רכיב הזיהוי. להקלטת דיבור: בנה אפליקציה עם EAS (דב־קליינט) או הרץ אחרי npx expo prebuild.',
  visibilityTime: 5000,
} as const

/**
 * דיבור־לטקסט לשדה טקסט — עברית (he-IL), תוצאות ביניים, אותו מנוע כמו במאמן.
 * ב‑Expo Go: Toast הסבר; בדב־קליינט / prebuild: מלא.
 */
export function useSpeechToTextField(
  value: string,
  onChangeText: (text: string) => void,
  disabled: boolean
) {
  const [isListening, setIsListening] = useState(false)
  const baseRef = useRef('')
  const listeningRef = useRef(false)
  const onChangeTextRef = useRef(onChangeText)
  onChangeTextRef.current = onChangeText

  useEffect(() => {
    if (!speech) return

    const subStart = speech.addListener('start', () => {
      listeningRef.current = true
      setIsListening(true)
    })
    const subEnd = speech.addListener('end', () => {
      listeningRef.current = false
      setIsListening(false)
    })
    const subResult = speech.addListener('result', (event) => {
      const piece = event.results[0]?.transcript ?? ''
      const base = baseRef.current
      const spacer = base.length > 0 && piece.length > 0 ? ' ' : ''
      onChangeTextRef.current(`${base}${spacer}${piece}`)
    })
    const subError = speech.addListener('error', (event) => {
      listeningRef.current = false
      setIsListening(false)
      if (event.error === 'aborted') return
      if (event.error === 'no-speech') return
      if (event.error === 'not-allowed') {
        Toast.show({
          type: 'info',
          text1: 'אין גישה למיקרופון או לזיהוי דיבור',
          text2: 'אפשר לאפשר בהגדרות המכשיר.',
          visibilityTime: 3500,
        })
        return
      }
      if (event.error === 'language-not-supported') {
        Toast.show({
          type: 'error',
          text1: 'שפת הדיבור לא נתמכת במכשיר זה',
          visibilityTime: 3000,
        })
        return
      }
      Toast.show({
        type: 'error',
        text1: 'זיהוי דיבור נכשל',
        text2: event.message || event.error,
        visibilityTime: 3000,
      })
    })

    return () => {
      subStart.remove()
      subEnd.remove()
      subResult.remove()
      subError.remove()
    }
  }, [])

  const toggleSpeech = useCallback(async () => {
    if (disabled) return

    if (!speech) {
      Toast.show({ type: 'info', ...EXPO_GO_SPEECH_MSG })
      return
    }

    if (listeningRef.current) {
      speech.stop()
      return
    }

    if (!speech.isRecognitionAvailable()) {
      Toast.show({
        type: 'error',
        text1: 'זיהוי דיבור לא זמין במכשיר',
        visibilityTime: 3000,
      })
      return
    }

    const perm = await speech.requestPermissionsAsync()
    if (!perm.granted) {
      Toast.show({
        type: 'info',
        text1: 'נדרשת הרשאת מיקרופון וזיהוי דיבור',
        text2: 'אפשר לאפשר בהגדרות האפליקציה.',
        visibilityTime: 4000,
      })
      return
    }

    baseRef.current = value.trimEnd()

    const api = androidApiLevel()
    const canContinuous = Platform.OS === 'ios' || api >= 33

    speech.start({
      lang: LANG,
      interimResults: true,
      continuous: canContinuous,
      maxAlternatives: 1,
      iosTaskHint: 'dictation',
      androidIntentOptions:
        Platform.OS === 'android'
          ? { EXTRA_LANGUAGE_MODEL: 'free_form' }
          : undefined,
    })
  }, [disabled, value])

  useEffect(() => {
    return () => {
      if (!speech || !listeningRef.current) return
      try {
        speech.abort()
      } catch {
        /* noop */
      }
    }
  }, [])

  return { isListening, toggleSpeech }
}
