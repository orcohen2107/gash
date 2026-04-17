import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { logger } from './logger'

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store for development (when Upstash is not configured)
const rateLimitStore: Map<string, RateLimitRecord> = new Map()

// Upstash Redis client (for production rate limiting)
let redis: Redis | null = null

function getRedisClient(): Redis | null {
  if (redis) return redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null // Not configured
  }
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  return redis
}

const WINDOW_MS = 60 * 1000 // 1 minute
const DEFAULT_MAX_REQUESTS = 10

interface RateLimitOptions {
  limit?: number
  windowMs?: number
}

/**
 * Check if a user has exceeded rate limit (async version for Redis)
 * Returns { success: boolean, remaining: number, retryAfter: number }
 */
export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): Promise<{
  success: boolean
  remaining: number
  retryAfter: number | null
}> {
  const limit = options.limit ?? DEFAULT_MAX_REQUESTS
  const windowMs = options.windowMs ?? WINDOW_MS
  const now = Date.now()

  const redisClient = getRedisClient()

  if (redisClient) {
    // Use Redis (production)
    return checkRateLimitRedis(identifier, limit, windowMs, now, redisClient)
  } else {
    // Fallback to in-memory (development without Redis configured)
    return checkRateLimitInMemory(identifier, limit, windowMs, now)
  }
}

/**
 * In-memory rate limiting (development fallback)
 */
function checkRateLimitInMemory(
  identifier: string,
  limit: number,
  windowMs: number,
  now: number
): {
  success: boolean
  remaining: number
  retryAfter: number | null
} {
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
 * Redis-based rate limiting (production)
 */
async function checkRateLimitRedis(
  identifier: string,
  limit: number,
  windowMs: number,
  now: number,
  redisClient: Redis
): Promise<{
  success: boolean
  remaining: number
  retryAfter: number | null
}> {
  const key = `ratelimit:${identifier}`
  const ttlSeconds = Math.ceil(windowMs / 1000)

  try {
    // Get current count
    const currentCount = await redisClient.get<number>(key)
    const count = (currentCount ?? 0) + 1

    // Set with expiration
    await redisClient.setex(key, ttlSeconds, count)

    const remaining = Math.max(0, limit - count)
    const success = count <= limit
    const retryAfter = success ? null : ttlSeconds

    return {
      success,
      remaining,
      retryAfter,
    }
  } catch (err) {
    logger.warn('ratelimit.redis.error', {
      error: err instanceof Error ? err.message : String(err),
    })
    // Fallback to in-memory on Redis error
    return checkRateLimitInMemory(identifier, limit, windowMs, now)
  }
}

/**
 * Middleware to enforce rate limiting (async)
 * Returns NextResponse with 429 if limit exceeded
 */
export async function createRateLimitResponse(
  identifier: string,
  options: RateLimitOptions = {}
): Promise<NextResponse | null> {
  const { success, retryAfter } = await checkRateLimit(identifier, options)

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
