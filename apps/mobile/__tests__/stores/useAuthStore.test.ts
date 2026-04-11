import { useAuthStore } from '../../stores/useAuthStore'

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      userProfile: null,
      profileCacheUserId: null,
    })
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

  it('clears cached profile when the session switches to another user', () => {
    const firstSession = { user: { id: 'user-1', email: 'one@test.com' } } as any
    const secondSession = { user: { id: 'user-2', email: 'two@test.com' } } as any

    useAuthStore.getState().setSession(firstSession)
    useAuthStore.getState().setUserProfile({
      name: 'משתמש ראשון',
      age: 25,
      phone: '+972501111111',
    })

    useAuthStore.getState().setSession(secondSession)

    expect(useAuthStore.getState().user?.id).toBe('user-2')
    expect(useAuthStore.getState().userProfile).toBeNull()
    expect(useAuthStore.getState().profileCacheUserId).toBe('user-2')
  })
})
