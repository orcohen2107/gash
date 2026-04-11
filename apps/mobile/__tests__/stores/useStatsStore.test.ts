jest.mock('@gash/api-client', () => ({
  __mockClient: {
    insights: {
      get: jest.fn(),
    },
  },
  createApiClient: jest.fn(() => jest.requireMock('@gash/api-client').__mockClient),
}))

import type { Approach } from '@gash/types'
import { cache } from '../../lib/cache'
import { useLogStore } from '../../stores/useLogStore'
import { useStatsStore } from '../../stores/useStatsStore'

const mockClient = jest.requireMock('@gash/api-client').__mockClient

function approach(overrides: Partial<Approach>): Approach {
  return {
    id: 'approach-1',
    user_id: 'user-1',
    date: '2026-04-12',
    location: 'תל אביב',
    approach_type: 'direct',
    opener: 'היי',
    response: 'positive',
    chemistry_score: 8,
    follow_up: 'text',
    notes: null,
    created_at: '2026-04-12T08:00:00.000Z',
    ...overrides,
  }
}

describe('useStatsStore', () => {
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance

  beforeEach(async () => {
    jest.clearAllMocks()
    await cache.clear()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    useLogStore.setState({ approaches: [], loading: false, pendingEditApproach: null })
    useStatsStore.setState({
      streak: 0,
      totalApproaches: 0,
      successRate: 0,
      avgChemistry: 0,
      topApproachType: null,
      isLoadingInsights: false,
    })
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  it('initializes with zero streak', () => {
    expect(useStatsStore.getState().streak).toBe(0)
  })

  it('initializes with zero total approaches', () => {
    expect(useStatsStore.getState().totalApproaches).toBe(0)
  })

  it('computes KPIs from logged approaches', () => {
    useLogStore.setState({
      approaches: [
        approach({ id: '1', approach_type: 'direct', response: 'positive', chemistry_score: 8 }),
        approach({ id: '2', approach_type: 'direct', response: 'neutral', chemistry_score: 6 }),
        approach({ id: '3', approach_type: 'humor', response: 'dismissive', chemistry_score: 4 }),
      ],
    })

    useStatsStore.getState().computeStats()

    expect(useStatsStore.getState()).toMatchObject({
      totalApproaches: 3,
      successRate: 67,
      avgChemistry: 6,
      topApproachType: 'direct',
    })
  })

  it('resets KPI values when there are no approaches', () => {
    useLogStore.setState({ approaches: [] })

    useStatsStore.getState().computeStats()

    expect(useStatsStore.getState()).toMatchObject({
      totalApproaches: 0,
      successRate: 0,
      avgChemistry: 0,
      topApproachType: null,
    })
  })

  it('fetches and caches insights from the API client', async () => {
    const response = {
      insights: ['תובנה 1', 'תובנה 2', 'תובנה 3'],
      weeklyMission: {
        title: 'משימה',
        description: 'פנה פעמיים',
        target: 2,
        targetType: 'direct',
      },
      trend: 'עולה' as const,
      trendExplanation: 'יש שיפור',
    }
    mockClient.insights.get.mockResolvedValueOnce(response)

    const result = await useStatsStore.getState().fetchInsights()

    expect(result).toEqual(response)
    expect(mockClient.insights.get).toHaveBeenCalledTimes(1)
    expect(useStatsStore.getState().isLoadingInsights).toBe(false)
  })

  it('returns fresh cached insights without calling the API client', async () => {
    await cache.set('insights', ['תובנה מהמטמון'], { ttl: 60 * 60 * 1000 })

    const result = await useStatsStore.getState().fetchInsights()

    expect(mockClient.insights.get).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      insights: ['תובנה מהמטמון', '', ''],
      trend: 'יציב',
    })
    expect(useStatsStore.getState().isLoadingInsights).toBe(false)
  })

  it('returns stale cached insights when the API client fails', async () => {
    await cache.set('insights', ['תובנה ישנה'], { ttl: -1 })
    mockClient.insights.get.mockRejectedValueOnce(new Error('network'))

    const result = await useStatsStore.getState().fetchInsights()

    expect(mockClient.insights.get).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({
      insights: ['תובנה ישנה', '', ''],
      trend: 'יציב',
    })
    expect(useStatsStore.getState().isLoadingInsights).toBe(false)
  })
})
