import { useChatStore } from '../../stores/useChatStore'

describe('useChatStore', () => {
  beforeEach(() => {
    useChatStore.setState({ messages: [], loading: false })
  })

  it('initializes with empty messages', () => {
    expect(useChatStore.getState().messages).toEqual([])
  })

  it('has sendMessage function', () => {
    expect(typeof useChatStore.getState().sendMessage).toBe('function')
  })
})
