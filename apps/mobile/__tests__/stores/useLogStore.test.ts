jest.mock('@gash/api-client', () => ({
  __mockClient: {
    approaches: {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
  createApiClient: jest.fn(() => jest.requireMock('@gash/api-client').__mockClient),
}))

jest.mock('../../stores/useStatsStore', () => ({
  __mockIncrementStreak: jest.fn(),
  useStatsStore: {
    getState: () => ({
      incrementStreak: jest.requireMock('../../stores/useStatsStore').__mockIncrementStreak,
    }),
  },
}))

import Toast from 'react-native-toast-message'
import type { Approach } from '@gash/types'
import { useLogStore } from '../../stores/useLogStore'

const mockClient = jest.requireMock('@gash/api-client').__mockClient
const mockIncrementStreak = jest.requireMock('../../stores/useStatsStore').__mockIncrementStreak

const baseApproachInput = {
  date: '2026-04-12',
  location: 'תל אביב',
  approach_type: 'direct' as const,
  opener: 'היי',
  response: 'positive',
  chemistry_score: 8,
  follow_up: 'text' as const,
  notes: 'הלך טוב',
}

function savedApproach(overrides: Partial<Approach> = {}): Approach {
  return {
    id: 'approach-1',
    user_id: 'user-1',
    created_at: '2026-04-12T08:00:00.000Z',
    ...baseApproachInput,
    ...overrides,
  }
}

describe('useLogStore', () => {
  let setTimeoutSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockIncrementStreak.mockResolvedValue({ streak: 1, message: 'רצף עודכן' })
    useLogStore.setState({ approaches: [], loading: false, pendingEditApproach: null })
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    setTimeoutSpy = jest
      .spyOn(global, 'setTimeout')
      .mockImplementation((callback: (...args: unknown[]) => void) => {
        callback()
        return 0 as unknown as ReturnType<typeof setTimeout>
      })
  })

  afterEach(() => {
    setTimeoutSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('initializes with empty approaches', () => {
    expect(useLogStore.getState().approaches).toEqual([])
  })

  it('has addApproach function', () => {
    expect(typeof useLogStore.getState().addApproach).toBe('function')
  })

  it('loads approaches from the API client', async () => {
    const approaches = [savedApproach()]
    mockClient.approaches.list.mockResolvedValueOnce({ approaches })

    await useLogStore.getState().loadApproaches()

    expect(mockClient.approaches.list).toHaveBeenCalledTimes(1)
    expect(useLogStore.getState().approaches).toEqual(approaches)
    expect(useLogStore.getState().loading).toBe(false)
  })

  it('clears loading and keeps existing approaches when loading fails', async () => {
    const existing = savedApproach()
    useLogStore.setState({ approaches: [existing], loading: false })
    mockClient.approaches.list.mockRejectedValueOnce(new Error('network'))

    await useLogStore.getState().loadApproaches()

    expect(mockClient.approaches.list).toHaveBeenCalledTimes(1)
    expect(useLogStore.getState().approaches).toEqual([existing])
    expect(useLogStore.getState().loading).toBe(false)
  })

  it('replaces the optimistic approach with the server id after create succeeds', async () => {
    mockClient.approaches.create.mockResolvedValueOnce({
      id: 'server-id',
      feedback: 'כל הכבוד',
      created_at: '2026-04-12T08:00:00.000Z',
    })

    await useLogStore.getState().addApproach(baseApproachInput)

    const approaches = useLogStore.getState().approaches
    expect(approaches).toHaveLength(1)
    expect(approaches[0]).toMatchObject({ id: 'server-id', location: 'תל אביב' })
    expect(mockClient.approaches.create).toHaveBeenCalledWith(baseApproachInput)
    expect(Toast.show).toHaveBeenCalledWith({ type: 'success', text1: 'כל הכבוד' })
  })

  it('removes the optimistic approach after repeated create failures', async () => {
    mockClient.approaches.create.mockRejectedValue(new Error('network'))

    await useLogStore.getState().addApproach(baseApproachInput)

    expect(mockClient.approaches.create).toHaveBeenCalledTimes(3)
    expect(useLogStore.getState().approaches).toEqual([])
    expect(Toast.show).toHaveBeenCalledWith({
      type: 'error',
      text1: 'בעיה בשמירה',
      text2: 'בדוק את החיבור שלך ונסה שוב',
    })
  })

  it('rolls back an optimistic update when the API update fails', async () => {
    const original = savedApproach({ location: 'בר' })
    useLogStore.setState({ approaches: [original] })
    mockClient.approaches.update.mockRejectedValue(new Error('network'))

    await useLogStore.getState().updateApproach(original.id, { location: 'ים' })

    expect(mockClient.approaches.update).toHaveBeenCalledTimes(3)
    expect(useLogStore.getState().approaches).toEqual([original])
    expect(Toast.show).toHaveBeenCalledWith({
      type: 'error',
      text1: 'בעיה בעדכון',
      text2: 'בדוק את החיבור שלך ונסה שוב',
    })
  })

  it('restores a deleted approach when the API delete fails', async () => {
    const original = savedApproach()
    useLogStore.setState({ approaches: [original] })
    mockClient.approaches.delete.mockRejectedValue(new Error('network'))

    await useLogStore.getState().deleteApproach(original.id)

    expect(mockClient.approaches.delete).toHaveBeenCalledTimes(3)
    expect(useLogStore.getState().approaches).toEqual([original])
    expect(Toast.show).toHaveBeenCalledWith({
      type: 'error',
      text1: 'בעיה במחיקה',
      text2: 'בדוק את החיבור שלך ונסה שוב',
    })
  })
})
