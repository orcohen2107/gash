import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const SECURE_STORE_SIZE_LIMIT = 2000

const ExpoSecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> =>
    SecureStore.getItemAsync(key).catch(() => null),
  setItem: (key: string, value: string): Promise<void> => {
    if (value.length >= SECURE_STORE_SIZE_LIMIT) {
      return Promise.reject(
        new Error(`SecureStore size limit exceeded for key: ${key}`)
      )
    }
    return SecureStore.setItemAsync(key, value)
  },
  removeItem: (key: string): Promise<void> =>
    SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Required for React Native — no URL scheme
    },
  }
)
