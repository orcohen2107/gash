import { useState, useEffect } from 'react'
import NetInfo from '@react-native-community/netinfo'

export interface NetworkState {
  isConnected: boolean | null
  isInternetReachable: boolean | null
  isLoading: boolean
}

export function useNetworkStatus() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: null,
    isInternetReachable: null,
    isLoading: true,
  })

  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    const subscribe = async () => {
      unsubscribe = NetInfo.addEventListener((state) => {
        setNetworkState({
          isConnected: state.isConnected,
          isInternetReachable: state.isInternetReachable,
          isLoading: false,
        })

        // Log network status changes
        if (state.isConnected === false) {
          console.log('[Network] Going offline')
        } else if (state.isConnected === true && state.isInternetReachable === true) {
          console.log('[Network] Back online')
        }
      })

      // Get initial state
      const initialState = await NetInfo.fetch()
      setNetworkState({
        isConnected: initialState.isConnected,
        isInternetReachable: initialState.isInternetReachable,
        isLoading: false,
      })
    }

    subscribe()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  return networkState
}

/**
 * Check if device is currently offline
 */
export function isOffline(state: NetworkState): boolean {
  return state.isConnected === false || state.isInternetReachable === false
}
