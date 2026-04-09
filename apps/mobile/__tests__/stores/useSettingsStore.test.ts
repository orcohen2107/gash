import { useSettingsStore } from '../../stores/useSettingsStore'

describe('useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({ rtlInitialized: false })
  })

  it('initializes with rtlInitialized = false', () => {
    expect(useSettingsStore.getState().rtlInitialized).toBe(false)
  })

  it('setRtlInitialized(true) updates state', () => {
    useSettingsStore.getState().setRtlInitialized(true)
    expect(useSettingsStore.getState().rtlInitialized).toBe(true)
  })
})
