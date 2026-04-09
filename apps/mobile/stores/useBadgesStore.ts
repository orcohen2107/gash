import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createApiClient } from '@gash/api-client'
import { SERVER_URL, getAuthHeaders } from '@/lib/server'
import { useLogStore } from './useLogStore'
import { useStatsStore } from './useStatsStore'
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
  checkAndUnlockBadges: () => void
  isBadgeUnlocked: (badgeId: Badge['id']) => boolean
  fetchMission: () => Promise<Mission | null>
}

export const useBadgesStore = create<BadgesStore>()(
  persist(
    (set, get) => ({
      unlockedBadges: [],
      mission: null,

      isBadgeUnlocked: (badgeId: Badge['id']) => {
        return get().unlockedBadges.some((b) => b.id === badgeId)
      },

      fetchMission: async () => {
        try {
          const response = await fetch(`${SERVER_URL}/api/coach/mission`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify({}),
          })
          const mission = (await response.json()) as Mission
          set({ mission })
          return mission
        } catch (err) {
          console.error('Failed to fetch mission:', err)
          return null
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
            condition: () => false, // TODO: Check completed missions count
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
            }
          }
        })

        set({ unlockedBadges })
      },
    }),
    {
      name: 'gash-badges',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ unlockedBadges: state.unlockedBadges, mission: state.mission }),
    }
  )
)
