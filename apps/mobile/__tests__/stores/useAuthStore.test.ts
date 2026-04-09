import { useAuthStore } from '../../stores/useAuthStore'

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, session: null })
  })

  it('initializes with null user and session', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.session).toBeNull()
  })

  it('setSession updates user and session', () => {
    const mockSession = { user: { id: 'user-123', email: 'test@test.com' } } as any
    useAuthStore.getState().setSession(mockSession)
    expect(useAuthStore.getState().session).toEqual(mockSession)
    expect(useAuthStore.getState().user?.id).toBe('user-123')
  })

  it('setSession(null) clears user', () => {
    useAuthStore.getState().setSession(null)
    expect(useAuthStore.getState().user).toBeNull()
  })
})
