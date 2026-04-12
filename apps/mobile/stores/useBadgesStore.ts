import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createApiClient } from '@gash/api-client'
import { SERVER_URL, getAuthHeaders, handleAuthError } from '@/lib/server'
import { cache, CACHE_PRESETS } from '@/lib/cache'
import { useLogStore } from './useLogStore'
import { useStatsStore } from './useStatsStore'
import { sendLocalNotification } from '@/lib/notifications'
import type { Badge } from '@gash/constants'
import { BADGES } from '@gash/constants'
import type { ApproachType } from '@gash/types'

const client = createApiClient({
  serverUrl: SERVER_URL,
  getHeaders: getAuthHeaders,
  onAuthError: handleAuthError,
})

interface UnlockedBadge extends Badge {
  unlockedAt: string
}

export interface Mission {
  title: string
  description: string
  target: number
  target_approach_type: ApproachType
}

function isIntroMission(mission: Mission): boolean {
  return mission.title === 'ברוכים הבאים'
}

interface BadgesStore {
  unlockedBadges: UnlockedBadge[]
  mission: Mission | null
  missionsCompleted: number
  isLoadingMission: boolean
  checkAndUnlockBadges: () => void
  isBadgeUnlocked: (badgeId: Badge['id']) => boolean
  fetchMission: () => Promise<Mission | null>
  completeMission: () => Promise<void>
}

export const useBadgesStore = create<BadgesStore>()(
  persist(
    (set, get) => ({
      unlockedBadges: [],
      mission: null,
      missionsCompleted: 0,
      isLoadingMission: false,

      isBadgeUnlocked: (badgeId: Badge['id']) => {
        return get().unlockedBadges.some((b) => b.id === badgeId)
      },

      fetchMission: async () => {
        set({ isLoadingMission: true })
        try {
          // Check cache first (stale-while-revalidate pattern)
          const cachedWithMeta = await cache.getWithMetadata<Mission>('mission')
          const hasApproaches = useLogStore.getState().approaches.length > 0

          if (
            cachedWithMeta.data &&
            !cachedWithMeta.isExpired &&
            (!isIntroMission(cachedWithMeta.data) || !hasApproaches)
          ) {
            // Return fresh cached data
            set({ mission: cachedWithMeta.data, isLoadingMission: false })
            return cachedWithMeta.data
          }

          // Fetch fresh from server
          const response = await fetch(`${SERVER_URL}/api/coach/mission`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify({}),
          })
          if (!response.ok) {
            throw new Error(`Failed to fetch mission: ${response.status}`)
          }
          const mission = (await response.json()) as Mission
          set({ mission, isLoadingMission: false })

          if (isIntroMission(mission)) {
            await cache.delete('mission')
          } else {
            // Cache for 24 hours (mission updates daily)
            await cache.set('mission', mission, CACHE_PRESETS.VERY_LONG)
            sendLocalNotification(`📋 משימה שבועית חדשה`, `${mission.title}`)
          }

          return mission
        } catch (err) {
          console.error('Failed to fetch mission:', err)
          set({ isLoadingMission: false })

          // Try to return stale cache if available
          const cachedWithMeta = await cache.getWithMetadata<Mission>('mission')
          if (
            cachedWithMeta.data &&
            (!isIntroMission(cachedWithMeta.data) || useLogStore.getState().approaches.length === 0)
          ) {
            console.warn('Returning stale cached mission due to fetch error')
            set({ mission: cachedWithMeta.data })
            return cachedWithMeta.data
          }

          set({ mission: null })
          return null
        }
      },

      completeMission: async () => {
        try {
          const response = await fetch(`${SERVER_URL}/api/coach/mission`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify({ action: 'complete' }),
          })
          if (!response.ok) {
            throw new Error(`Failed to complete mission: ${response.status}`)
          }
          const data = (await response.json()) as { success: boolean }
          if (data.success) {
            // Increment local missionsCompleted counter
            set({ missionsCompleted: get().missionsCompleted + 1 })
            await cache.delete('mission')
          }
        } catch (err) {
          console.error('Failed to complete mission:', err)
        }
      },

      checkAndUnlockBadges: () => {
        const approaches = useLogStore.getState().approaches
        const { streak } = useStatsStore.getState()
        const missionsCompleted = get().missionsCompleted

        const badgesToCheck: Array<{
          id: Badge['id']
          condition: () => boolean
        }> = [
          {
            id: 'first-step',
            condition: () => approaches.length >= 1,
          },
          {
            id: 'starter',
            condition: () => approaches.length >= 5,
          },
          {
            id: 'seasoned',
            condition: () => approaches.length >= 10,
          },
          {
            id: 'legend',
            condition: () => approaches.length >= 25,
          },
          {
            id: 'dominator',
            condition: () => approaches.length >= 50,
          },
          {
            id: 'three-day-streak',
            condition: () => streak >= 3,
          },
          {
            id: 'seven-day-streak',
            condition: () => streak >= 7,
          },
          {
            id: 'direct-master',
            condition: () => {
              const directApproaches = approaches.filter((a) => a.approach_type === 'direct')
              if (directApproaches.length < 10) return false
              const successCount = directApproaches.filter(
                (a) => a.response === 'positive' || a.response === 'neutral'
              ).length
              return (successCount / directApproaches.length) * 100 > 60
            },
          },
          {
            id: 'situational-player',
            condition: () => {
              return approaches.filter((a) => a.approach_type === 'situational').length >= 5
            },
          },
          {
            id: 'online-active',
            condition: () => {
              return approaches.filter((a) => a.approach_type === 'online').length >= 5
            },
          },
          {
            id: 'high-spark',
            condition: () => {
              return approaches.filter((a) => (a.chemistry_score ?? 0) >= 8).length >= 5
            },
          },
          {
            id: 'charmer',
            condition: () => {
              const humorApproaches = approaches.filter((a) => a.approach_type === 'humor')
              if (humorApproaches.length < 10) return false
              const successCount = humorApproaches.filter(
                (a) => a.response === 'positive' || a.response === 'neutral'
              ).length
              return (successCount / humorApproaches.length) * 100 > 70
            },
          },
          {
            id: 'savant',
            condition: () => missionsCompleted >= 5,
          },
        ]

        /**
         * תגים שנשמרו ב־AsyncStorage מהעבר — אם הנתונים הנוכחיים (גישות/רצף וכו') כבר לא
         * עומדים בתנאי, מסירים את התג. כך לא יופיע «השגת» ביחד עם 0/25 גישות.
         */
        let unlockedBadges = get().unlockedBadges.filter((ub) => {
          const rule = badgesToCheck.find((c) => c.id === ub.id)
          return rule ? rule.condition() : false
        })

        badgesToCheck.forEach((badge) => {
          const isAlreadyUnlocked = unlockedBadges.some((b) => b.id === badge.id)
          if (!isAlreadyUnlocked && badge.condition()) {
            const badgeData = BADGES.find((b) => b.id === badge.id)
            if (badgeData) {
              unlockedBadges = [
                ...unlockedBadges,
                {
                  ...badgeData,
                  unlockedAt: new Date().toISOString(),
                },
              ]
              sendLocalNotification(`🏆 תג חדש!`, `${badgeData.title} — ${badgeData.description}`)
            }
          }
        })

        set({ unlockedBadges })
      },
    }),
    {
      name: 'gash-badges',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ unlockedBadges: state.unlockedBadges, mission: state.mission, missionsCompleted: state.missionsCompleted }),
    }
  )
)
