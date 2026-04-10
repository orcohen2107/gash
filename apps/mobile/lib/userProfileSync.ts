import { useAuthStore } from '@/stores/useAuthStore'
import { SERVER_URL, getAuthHeaders } from '@/lib/server'
import type { UserProfile } from '@gash/types'

/** טוען פרופיל מהשרת ומסנכרן ל-useAuthStore (כולל תמונת פרופיל). */
export async function fetchAndSyncUserProfile(): Promise<void> {
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
    // שקט — מסכים ימשיכו בלי תמונה
  }
}
