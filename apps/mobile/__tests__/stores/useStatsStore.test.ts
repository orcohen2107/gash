import { useStatsStore } from '../../stores/useStatsStore'

describe('useStatsStore', () => {
  beforeEach(() => {
    useStatsStore.setState({ streak: 0, totalApproaches: 0, avgChemistry: 0, topApproachType: null })
  })

  it('initializes with zero streak', () => {
    expect(useStatsStore.getState().streak).toBe(0)
  })

  it('initializes with zero total approaches', () => {
    expect(useStatsStore.getState().totalApproaches).toBe(0)
  })
})
