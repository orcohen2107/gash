/**
 * Analytics Wrapper
 * Tracks user actions and app events for product insights
 *
 * Uses PostHog for analytics (https://posthog.com)
 * - Free tier: 1M events/month
 * - Hebrew-friendly
 * - Works offline-first
 *
 * Setup: Set EXPO_PUBLIC_POSTHOG_API_KEY in .env
 */

interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
}

class Analytics {
  private isInitialized = false
  private apiKey: string | null = null
  private userId: string | null = null

  /**
   * Initialize analytics with PostHog API key
   * Called once on app start
   */
  async initialize(userId: string): Promise<void> {
    this.userId = userId
    this.apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || null

    if (!this.apiKey) {
      console.warn('PostHog API key not configured — analytics disabled')
      return
    }

    this.isInitialized = true
    this.trackEvent({
      name: 'app_opened',
      properties: {
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Track a user event
   * Queued locally if offline, sent when online
   */
  private async trackEvent({ name, properties }: AnalyticsEvent): Promise<void> {
    if (!this.isInitialized || !this.apiKey || !this.userId) {
      return
    }

    try {
      const payload = {
        api_key: this.apiKey,
        event: name,
        properties: {
          ...properties,
          $set: {
            user_id: this.userId,
          },
        },
        timestamp: new Date().toISOString(),
      }

      // Queue event to local storage for offline support
      await this.queueEvent(payload)

      // Try to send immediately
      this.sendQueuedEvents()
    } catch (err) {
      console.error('Failed to track event:', err)
    }
  }

  /**
   * Queue event to AsyncStorage for offline support
   */
  private async queueEvent(event: any): Promise<void> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage').then(
        (m) => m.default
      )
      const queue = await AsyncStorage.getItem('analytics_queue')
      const events = queue ? JSON.parse(queue) : []
      events.push(event)
      await AsyncStorage.setItem('analytics_queue', JSON.stringify(events))
    } catch (err) {
      console.error('Failed to queue event:', err)
    }
  }

  /**
   * Send all queued events to PostHog
   * Called periodically or when network is detected
   */
  private async sendQueuedEvents(): Promise<void> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage').then(
        (m) => m.default
      )
      const queue = await AsyncStorage.getItem('analytics_queue')
      if (!queue || !this.apiKey) return

      const events = JSON.parse(queue)
      if (events.length === 0) return

      // Send batch to PostHog
      const response = await fetch('https://us.posthog.com/batch/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          batch: events,
        }),
      })

      if (response.ok) {
        // Clear queue on successful send
        await AsyncStorage.setItem('analytics_queue', '[]')
      }
    } catch (err) {
      console.error('Failed to send queued events:', err)
    }
  }

  // ========== Public Event Tracking Methods ==========

  trackScreenView(screenName: string): void {
    this.trackEvent({
      name: 'screen_viewed',
      properties: {
        screen: screenName,
      },
    })
  }

  trackButtonClick(buttonName: string, screenName?: string): void {
    this.trackEvent({
      name: 'button_clicked',
      properties: {
        button: buttonName,
        screen: screenName,
      },
    })
  }

  trackMessageSent(messageLength: number): void {
    this.trackEvent({
      name: 'message_sent',
      properties: {
        length: messageLength,
      },
    })
  }

  trackApproachLogged(approachType: string, chemistry: number, followUp?: string): void {
    this.trackEvent({
      name: 'approach_logged',
      properties: {
        approach_type: approachType,
        chemistry: chemistry,
        follow_up: followUp,
      },
    })
  }

  trackStreakMilestone(streak: number): void {
    this.trackEvent({
      name: 'streak_milestone',
      properties: {
        streak: streak,
      },
    })
  }

  trackInsightsViewed(approachCount: number): void {
    this.trackEvent({
      name: 'insights_viewed',
      properties: {
        approach_count: approachCount,
      },
    })
  }

  trackMissionStarted(missionTitle: string): void {
    this.trackEvent({
      name: 'mission_started',
      properties: {
        mission_title: missionTitle,
      },
    })
  }

  trackMissionCompleted(missionTitle: string, completionTime: number): void {
    this.trackEvent({
      name: 'mission_completed',
      properties: {
        mission_title: missionTitle,
        completion_time_seconds: completionTime,
      },
    })
  }

  trackFeatureUsage(featureName: string, context?: Record<string, any>): void {
    this.trackEvent({
      name: `feature_${featureName}`,
      properties: context,
    })
  }

  trackError(errorName: string, errorMessage: string, context?: Record<string, any>): void {
    this.trackEvent({
      name: 'error_occurred',
      properties: {
        error_name: errorName,
        error_message: errorMessage,
        ...context,
      },
    })
  }

  /**
   * Called when user logs out or connection restored
   */
  async flushQueue(): Promise<void> {
    await this.sendQueuedEvents()
  }
}

// Export singleton instance
export const analytics = new Analytics()
