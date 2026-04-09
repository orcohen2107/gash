import React from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useAuthStore } from '@/stores/useAuthStore'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught error:', error)
    console.error('Error info:', errorInfo)

    this.setState({
      errorInfo: errorInfo.componentStack,
    })

    // Send to Sentry (when configured)
    // Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleSignOut = async () => {
    try {
      await useAuthStore.getState().signOut()
    } catch (err) {
      console.error('Failed to sign out:', err)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', padding: 20 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: '#d32f2f',
                marginBottom: 12,
                textAlign: 'right',
              }}
            >
              משהו השתבש 😞
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: '#424242',
                marginBottom: 16,
                lineHeight: 24,
                textAlign: 'right',
              }}
            >
              {this.state.error?.message || 'שגיאה בלתי צפויה'}
            </Text>

            {__DEV__ && this.state.errorInfo && (
              <View
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: '#666',
                    fontFamily: 'Courier New',
                    lineHeight: 18,
                    textAlign: 'right',
                  }}
                >
                  {this.state.errorInfo}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={this.handleReset}
              style={{
                backgroundColor: '#1976d2',
                padding: 12,
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: '600',
                  textAlign: 'center',
                }}
              >
                נסה שוב
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={this.handleSignOut}
              style={{
                backgroundColor: '#e0e0e0',
                padding: 12,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: '#424242',
                  fontSize: 16,
                  fontWeight: '600',
                  textAlign: 'center',
                }}
              >
                התחבר מחדש
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )
    }

    return this.props.children
  }
}
