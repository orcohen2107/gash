import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * אחסון session ב-AsyncStorage (ללא מגבלת 2048 בתים של Expo SecureStore).
 * ה-JWT + אובייקט user מהשרת יכולים לחרוג ממגבלה זו — SecureStore דחה שמירה.
 * AsyncStorage בתוך sandbox של האפליקציה; לפרודקשן זה דפוס מקובל ב-Expo + Supabase.
 */
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
