jest.mock('@gash/api-client', () => ({
  __mockClient: {
    coach: {
      history: jest.fn(),
      send: jest.fn(),
    },
  },
  createApiClient: jest.fn(() => jest.requireMock('@gash/api-client').__mockClient),
}))

import Toast from 'react-native-toast-message'
import { useChatStore } from '../../stores/useChatStore'

const mockClient = jest.requireMock('@gash/api-client').__mockClient

describe('useChatStore', () => {
  let setTimeoutSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    useChatStore.setState({ messages: [], loading: false })
    setTimeoutSpy = jest
      .spyOn(global, 'setTimeout')
      .mockImplementation((callback: (...args: unknown[]) => void) => {
        callback()
        return 0 as unknown as ReturnType<typeof setTimeout>
      })
  })

  afterEach(() => {
    setTimeoutSpy.mockRestore()
  })

  it('initializes with empty messages', () => {
    expect(useChatStore.getState().messages).toEqual([])
  })

  it('has sendMessage function', () => {
    expect(typeof useChatStore.getState().sendMessage).toBe('function')
  })

  it('loads chat history from the API client', async () => {
    const messages = [
      {
        id: 'msg-1',
        user_id: 'user-1',
        role: 'assistant' as const,
        content: 'שלום',
        created_at: '2026-04-12T08:00:00.000Z',
      },
    ]
    mockClient.coach.history.mockResolvedValueOnce({ messages })

    await useChatStore.getState().loadHistory()

    expect(mockClient.coach.history).toHaveBeenCalledTimes(1)
    expect(useChatStore.getState().messages).toEqual(messages)
    expect(useChatStore.getState().loading).toBe(false)
  })

  it('shows an error and clears loading when history loading fails', async () => {
    mockClient.coach.history.mockRejectedValueOnce(new Error('network'))

    await useChatStore.getState().loadHistory()

    expect(useChatStore.getState().messages).toEqual([])
    expect(useChatStore.getState().loading).toBe(false)
    expect(Toast.show).toHaveBeenCalledWith({
      type: 'error',
      text1: 'בעיה בטעינה',
      text2: 'לא הצלחנו לטעון את ההיסטוריה',
    })
  })

  it('adds user and assistant messages when sendMessage succeeds', async () => {
    mockClient.coach.send.mockResolvedValueOnce({ text: 'תשובה טובה' })

    await useChatStore.getState().sendMessage('  היי  ')

    const messages = useChatStore.getState().messages
    expect(messages).toHaveLength(2)
    expect(messages[0]).toMatchObject({ role: 'user', content: 'היי' })
    expect(messages[1]).toMatchObject({ role: 'assistant', content: 'תשובה טובה' })
    expect(mockClient.coach.send).toHaveBeenCalledWith({
      type: 'coach',
      messages: [{ role: 'user', content: 'היי' }],
    })
    expect(useChatStore.getState().loading).toBe(false)
  })

  it('does not send blank messages', async () => {
    await useChatStore.getState().sendMessage('   ')

    expect(mockClient.coach.send).not.toHaveBeenCalled()
    expect(useChatStore.getState().messages).toEqual([])
  })

  it('rolls back the optimistic user message after repeated send failures', async () => {
    mockClient.coach.send.mockRejectedValue(new Error('network'))

    await useChatStore.getState().sendMessage('בדיקה')

    expect(mockClient.coach.send).toHaveBeenCalledTimes(3)
    expect(useChatStore.getState().messages).toEqual([])
    expect(useChatStore.getState().loading).toBe(false)
    expect(Toast.show).toHaveBeenCalledWith({
      type: 'error',
      text1: 'בעיה בשליחה',
      text2: 'בדוק את החיבור שלך ונסה שוב',
    })
  })
})
