import { requireOptionalNativeModule } from 'expo-modules-core'
import type { ExpoSpeechRecognitionModuleType } from 'expo-speech-recognition/build/ExpoSpeechRecognitionModule.types'

/**
 * ב‑Expo Go אין את המודול הנטיבי — מחזיר null בלי לזרוק.
 * בבניית פיתוח / פרוד עם prebuild — אותו API כמו ב־expo-speech-recognition.
 */
export function getExpoSpeechRecognitionModule(): ExpoSpeechRecognitionModuleType | null {
  return requireOptionalNativeModule<ExpoSpeechRecognitionModuleType>('ExpoSpeechRecognition')
}
