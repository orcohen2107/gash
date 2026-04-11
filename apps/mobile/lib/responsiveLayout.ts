import { useWindowDimensions, Platform, type ViewStyle } from 'react-native'

/** מסכים צרים (אנדרואיד קטן, SE) — פחות ריווח צדדי */
export const BREAKPOINT_NARROW = 360
/** מסכים רחבים — קצת יותר אוויר */
export const BREAKPOINT_WIDE = 430

/** ריווח אופקי (padding) לפי רוחב מסך — לא קבוע 24px בלבד */
export function horizontalGutter(width: number): number {
  if (width < BREAKPOINT_NARROW) return 12
  if (width > BREAKPOINT_WIDE) return 28
  return 16
}

/**
 * מסכי התחברות / הרשמה / OTP — מעט יותר אוויר מ־gutter רגיל במסכים בינוניים
 * כדי שלא ייראו צפופים באנדרואיד צר או טאבלט קטן.
 */
export function authScrollPaddingX(width: number): number {
  if (width < BREAKPOINT_NARROW) return 14
  if (width > BREAKPOINT_WIDE) return 28
  return 20
}

/** מסך פתיחה (welcome) — ריווח צדדי נדיב יותר */
export function welcomeScreenPaddingX(width: number): number {
  if (width < BREAKPOINT_NARROW) return 20
  if (width > BREAKPOINT_WIDE) return 36
  return 28
}

export function useHorizontalGutter(): number {
  const { width } = useWindowDimensions()
  return horizontalGutter(width)
}

/** גודל כותרת בסרגל עליון — קטן מעט במסכים צרים */
export function topBarTitleSize(width: number, isBrand: boolean): number {
  if (width < BREAKPOINT_NARROW) return isBrand ? 20 : 17
  return isBrand ? 22 : 20
}

/**
 * צל לסרגל תחתון: iOS משתמש ב-shadow*, באנדרואיד ב-elevation (נראה טוב בשניהם)
 */
export function tabBarElevationStyle(): Pick<
  ViewStyle,
  'elevation' | 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius'
> {
  if (Platform.OS === 'android') {
    return {
      elevation: 14,
    }
  }
  return {
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  }
}

/** צל רך לכרטיסים / כפתורי CTA — iOS shadow מול Android elevation בלבד */
export function softElevatedSurface(accentColor: string): ViewStyle {
  if (Platform.OS === 'android') {
    return { elevation: 8 }
  }
  return {
    elevation: 0,
    shadowColor: accentColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
  }
}
