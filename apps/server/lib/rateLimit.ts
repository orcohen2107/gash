import { NextResponse } from 'next/server'
import { logger } from './logger'

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store for development (replace with Upstash in production)
const rateLimitStore: Map<string, RateLimitRecord> = new Map()

const WINDOW_MS = 60 * 1000 // 1 minute
const DEFAULT_MAX_REQUESTS = 10

interface RateLimitOptions {
  limit?: number
  windowMs?: number
}

/**
 * Check if a user has exceeded rate limit
 * Returns { success: boolean, remaining: number, retryAfter: number }
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): {
  success: boolean
  remaining: number
  retryAfter: number | null
} {
  const limit = options.limit ?? DEFAULT_MAX_REQUESTS
  const windowMs = options.windowMs ?? WINDOW_MS
  const now = Date.now()

  let record = rateLimitStore.get(identifier)

  // Initialize or reset if window expired
  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(identifier, record)
    return {
      success: true,
      remaining: limit - 1,
      retryAfter: null,
    }
  }

  // Increment count
  record.count++

  const remaining = Math.max(0, limit - record.count)
  const success = record.count <= limit
  const retryAfter = success ? null : Math.ceil((record.resetTime - now) / 1000)

  return {
    success,
    remaining,
    retryAfter,
  }
}

/**
 * Middleware to enforce rate limiting
 * Returns NextResponse with 429 if limit exceeded
 */
export function createRateLimitResponse(
  identifier: string,
  options: RateLimitOptions = {}
): NextResponse | null {
  const { success, remaining, retryAfter } = checkRateLimit(identifier, options)

  if (!success && retryAfter) {
    return new NextResponse(
      JSON.stringify({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
        },
      }),
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
        },
      }
    )
  }

  return null
}

/**
 * Cleanup old entries from in-memory store (call periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now()
  let cleaned = 0

  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime + 60 * 1000) {
      // Clean up 1 minute after reset
      rateLimitStore.delete(key)
      cleaned++
    }
  }
}

/**
 * TODO: In Vercel Serverless Functions, setInterval doesn't work reliably.
 * The process is recycled between requests, so the interval is never triggered.
 * For production, replace this with Upstash Redis:
 * https://upstash.com/docs/redis/features/ratelimiting
 *
 * Current implementation works in development but NOT in production.
 */
// Cleanup disabled for serverless compatibility (Vercel recycles processes)
// setInterval(() => {
//   cleanupRateLimitStore()
// }, 5 * 60 * 1000)
