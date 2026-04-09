import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createApiClient } from '@gash/api-client'
import { SERVER_URL, getAuthHeaders } from '@/lib/server'
import { cache, CACHE_PRESETS } from '@/lib/cache'
import { useLogStore } from './useLogStore'
import { useStatsStore } from './useStatsStore'
import { sendLocalNotification } from '@/lib/notifications'
import type { Badge } from '@gash/constants'
import { BADGES } from '@gash/constants'
import type { ApproachType } from '@gash/types'

const client = createApiClient({ serverUrl: SERVER_URL, getHeaders: getAuthHeaders })

interface UnlockedBadge extends Badge {
  unlockedAt: string
}

export interface Mission {
  title: string
  description: string
  target: number
  target_approach_type: ApproachType
}

interface BadgesStore {
  unlockedBadges: UnlockedBadge[]
  mission: Mission | null
  missionsCompleted: number
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

      isBadgeUnlocked: (badgeId: Badge['id']) => {
        return get().unlockedBadges.some((b) => b.id === badgeId)
      },

      fetchMission: async () => {
        try {
          // Check cache first (stale-while-revalidate pattern)
          const cachedWithMeta = await cache.getWithMetadata<Mission>('mission')

          if (cachedWithMeta.data && !cachedWithMeta.isExpired) {
            // Return fresh cached data
            return cachedWithMeta.data
          }

          // Fetch fresh from server
          const response = await fetch(`${SERVER_URL}/api/coach/mission`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify({}),
          })
          const mission = (await response.json()) as Mission
          set({ mission })

          // Cache for 24 hours (mission updates daily)
          await cache.set('mission', mission, CACHE_PRESETS.VERY_LONG)

          // Trigger notification for new mission (only on fresh fetch)
          sendLocalNotification(`📋 משימה שבועית חדשה`, `${mission.title}`)
          return mission
        } catch (err) {
          console.error('Failed to fetch mission:', err)

          // Try to return stale cache if available
          const cachedWithMeta = await cache.getWithMetadata<Mission>('mission')
          if (cachedWithMeta.data) {
            console.warn('Returning stale cached mission due to fetch error')
            return cachedWithMeta.data
          }

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
          const data = (await response.json()) as { success: boolean }
          if (data.success) {
            // Increment local missionsCompleted counter
            set({ missionsCompleted: get().missionsCompleted + 1 })
          }
        } catch (err) {
          console.error('Failed to complete mission:', err)
        }
      },

      checkAndUnlockBadges: () => {
        const approaches = useLogStore.getState().approaches
        const { streak } = useStatsStore.getState()
        const unlockedBadges = [...get().unlockedBadges]

        const badgesToCheck: Array<{
          id: Badge['id']
          condition: () => boolean
        }> = [
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
            condition: () => get().missionsCompleted >= 5,
          },
        ]

        badgesToCheck.forEach((badge) => {
          const isAlreadyUnlocked = unlockedBadges.some((b) => b.id === badge.id)
          if (!isAlreadyUnlocked && badge.condition()) {
            const badgeData = BADGES.find((b) => b.id === badge.id)
            if (badgeData) {
              unlockedBadges.push({
                ...badgeData,
                unlockedAt: new Date().toISOString(),
              })
              // Trigger notification
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
