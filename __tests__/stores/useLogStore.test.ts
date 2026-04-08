import { useLogStore } from '../../stores/useLogStore'

describe('useLogStore', () => {
  beforeEach(() => {
    useLogStore.setState({ approaches: [], loading: false })
  })

  it('initializes with empty approaches', () => {
    expect(useLogStore.getState().approaches).toEqual([])
  })

  it('has addApproach function', () => {
    expect(typeof useLogStore.getState().addApproach).toBe('function')
  })
})
