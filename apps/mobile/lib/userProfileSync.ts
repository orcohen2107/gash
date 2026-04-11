import { useAuthStore } from '@/stores/useAuthStore'
import { SERVER_URL, getAuthHeaders } from '@/lib/server'
import type { UserProfile } from '@gash/types'

export type FetchProfileOptions = {
  /** true אחרי שמירה / העלאת תמונה — תמיד לרענן מהשרת */
  force?: boolean
}

/** מונע כמה קריאות מקבילות לאותו endpoint (למשל layout + מסך אימות). */
let profileFetchInFlight: Promise<void> | null = null

/**
 * טוען פרופיל מהשרת ל־useAuthStore.
 * כבר יש מטמון ב-Zustand persist — בלי `force` לא נורה רשת אם כבר נטען פרופיל למשתמש הנוכחי.
 */
export async function fetchAndSyncUserProfile(options?: FetchProfileOptions): Promise<void> {
  const force = options?.force === true
  const state = useAuthStore.getState()
  const uid = state.session?.user?.id
  if (!uid) return

  if (!force) {
    const { userProfile, profileCacheUserId } = state
    if (userProfile != null && profileCacheUserId === uid) {
      return
    }
  }

  if (profileFetchInFlight) {
    return profileFetchInFlight
  }
  profileFetchInFlight = (async () => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${SERVER_URL}/api/user/profile`, { headers })
      const json = (await res.json().catch(() => ({}))) as {
        profile: {
          name: string | null
          age: number | null
          phone: string | null
          email: string | null
          avatar_url: string | null
        } | null
      }
      if (!res.ok || !json.profile) {
        return
      }
      const p = json.profile
      const mapped: UserProfile = {
        name: p.name ?? '',
        age: p.age ?? 0,
        email: p.email,
        avatar_url: p.avatar_url,
        phone: p.phone,
      }
      useAuthStore.getState().setUserProfile(mapped)
    } catch {
      // שקט — מסכים ימשיכו בלי תמונה / בלי שם
    } finally {
      profileFetchInFlight = null
    }
  })()
  return profileFetchInFlight
}
