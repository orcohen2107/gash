import { createApiClient } from '@gash/api-client'
import type { DashboardResponse } from '@gash/types'
import { SERVER_URL, getAuthHeaders, handleAuthError } from '@/lib/server'
import { cache, CACHE_PRESETS } from '@/lib/cache'
import { useLogStore } from '@/stores/useLogStore'
import { useBadgesStore } from '@/stores/useBadgesStore'
import { useStatsStore } from '@/stores/useStatsStore'

const client = createApiClient({
  serverUrl: SERVER_URL,
  getHeaders: getAuthHeaders,
  onAuthError: handleAuthError,
})

/**
 * טעינה אחת מהשרת: גישות, KPI (דרך מנוי computeStats), תובנות במטמון, משימה שבועית.
 */
export async function loadDashboardBundle(): Promise<DashboardResponse> {
  const data = await client.dashboard.get()
  useLogStore.setState({ approaches: data.approaches })
  useStatsStore.getState().setStats({ ...data.kpis, streak: data.streak })
  useBadgesStore.setState({ mission: data.mission, isLoadingMission: false })
  /** גישות עודכנו מהשרת — בודקים תגים מול דאטה אמיתי */
  useBadgesStore.getState().checkAndUnlockBadges()
  await cache.set('insights', data.insights, CACHE_PRESETS.LONG)
  return data
}
