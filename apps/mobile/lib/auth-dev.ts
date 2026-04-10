/**
 * מספר וקוד בדיקה — חייבים להתאים ל־Supabase → Auth → Phone → Test phone numbers
 * (למשל +972504322800=123456). אפשר לעקוף עם EXPO_PUBLIC_DEV_TEST_PHONE / EXPO_PUBLIC_DEV_TEST_OTP
 */
export const DEV_TEST_PHONE =
  (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_DEV_TEST_PHONE) || '+972504322800'

export const DEV_TEST_OTP =
  (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_DEV_TEST_OTP) || '123456'

export function isDevTestPhone(phone: string | undefined): boolean {
  if (!phone) return false
  return phone.replace(/\s/g, '') === DEV_TEST_PHONE
}
