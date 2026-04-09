/**
 * Cache Utility
 * Simple in-memory + AsyncStorage cache for API responses
 * Supports TTL (time-to-live) and stale-while-revalidate pattern
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // milliseconds
}

interface CacheOptions {
  ttl?: number // time-to-live in milliseconds (default 1 hour)
  useAsyncStorage?: boolean // persist to disk (default true)
}

class Cache {
  private memory = new Map<string, CacheEntry<any>>()
  private defaultTTL = 60 * 60 * 1000 // 1 hour

  /**
   * Get cached value if not expired
   */
  async get<T>(key: string, options?: { fromMemoryOnly?: boolean }): Promise<T | null> {
    // Check memory cache first
    const memoryEntry = this.memory.get(key)
    if (memoryEntry && this.isValid(memoryEntry)) {
      return memoryEntry.data as T
    }

    // Check AsyncStorage if not memory-only
    if (!options?.fromMemoryOnly) {
      try {
        const cached = await AsyncStorage.getItem(`cache_${key}`)
        if (cached) {
          const entry: CacheEntry<T> = JSON.parse(cached)
          if (this.isValid(entry)) {
            // Restore to memory cache
            this.memory.set(key, entry)
            return entry.data
          } else {
            // Expired, delete
            await AsyncStorage.removeItem(`cache_${key}`)
          }
        }
      } catch (err) {
        console.error('Cache get error:', err)
      }
    }

    return null
  }

  /**
   * Set cache value with TTL
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl ?? this.defaultTTL
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    }

    // Set in memory
    this.memory.set(key, entry)

    // Set in AsyncStorage if enabled
    if (options.useAsyncStorage !== false) {
      try {
        await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(entry))
      } catch (err) {
        console.error('Cache set error:', err)
      }
    }
  }

  /**
   * Get cache entry metadata (stale-while-revalidate pattern)
   * Returns data even if expired, with metadata
   */
  async getWithMetadata<T>(
    key: string
  ): Promise<
    | { data: T; isExpired: false }
    | { data: T; isExpired: true }
    | { data: null; isExpired: null }
  > {
    const memoryEntry = this.memory.get(key)
    const isMemoryValid = memoryEntry && this.isValid(memoryEntry)

    if (memoryEntry) {
      const isExpired = !isMemoryValid
      return { data: memoryEntry.data as T, isExpired }
    }

    // Check AsyncStorage
    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`)
      if (cached) {
        const entry: CacheEntry<T> = JSON.parse(cached)
        const isExpired = !this.isValid(entry)
        this.memory.set(key, entry)
        return { data: entry.data, isExpired }
      }
    } catch (err) {
      console.error('Cache getWithMetadata error:', err)
    }

    return { data: null, isExpired: null }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    this.memory.delete(key)
    try {
      await AsyncStorage.removeItem(`cache_${key}`)
    } catch (err) {
      console.error('Cache delete error:', err)
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memory.clear()
    try {
      const keys = await AsyncStorage.getAllKeys()
      const cacheKeys = keys.filter((k) => k.startsWith('cache_'))
      await AsyncStorage.multiRemove(cacheKeys)
    } catch (err) {
      console.error('Cache clear error:', err)
    }
  }

  /**
   * Check if cache entry is still valid (not expired)
   */
  private isValid(entry: CacheEntry<any>): boolean {
    const age = Date.now() - entry.timestamp
    return age < entry.ttl
  }
}

export const cache = new Cache()

/**
 * Cache options presets for common scenarios
 */
export const CACHE_PRESETS = {
  SHORT: { ttl: 5 * 60 * 1000 }, // 5 minutes
  MEDIUM: { ttl: 30 * 60 * 1000 }, // 30 minutes
  LONG: { ttl: 60 * 60 * 1000 }, // 1 hour
  VERY_LONG: { ttl: 24 * 60 * 60 * 1000 }, // 24 hours
}
