import { NextRequest, NextResponse } from 'next/server'
import { POST } from '@/app/api/user/streak/route'

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn(),
}))

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
  createServiceClient: jest.fn(),
}))

import { verifyAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

describe('POST /api/user/streak', () => {
  let mockRequest: Partial<NextRequest>
  let mockSupabaseQuery: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock request
    mockRequest = {
      json: jest.fn().mockResolvedValue({ action: 'increment' }),
      headers: new Headers(),
    }

    // Mock supabase query chain
    mockSupabaseQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      upsert: jest.fn(),
    }

    // Setup default mock implementations
    ;(verifyAuth as jest.Mock).mockResolvedValue({ userId: 'test-user-id' })
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockSupabaseQuery)
  })

  test('returns 401 when userId is missing', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({ userId: null })

    const response = await POST(mockRequest as NextRequest)
    expect(response.status).toBe(401)
  })

  test('returns streak = 1 for first-ever approach (no prior last_approach_date)', async () => {
    // Mock: last approach exists (date fetched)
    mockSupabaseQuery.select.mockReturnValueOnce({
      eq: jest.fn().mockResolvedValueOnce({
        data: [{ date: '2024-01-01' }],
      }),
    })

    // Mock: user_insights has no prior last_approach_date
    mockSupabaseQuery.select.mockReturnValueOnce({
      eq: jest.fn().mockResolvedValueOnce({
        data: { streak: 0, last_approach_date: null },
      }),
    })

    // Mock: upsert succeeds
    mockSupabaseQuery.upsert.mockResolvedValueOnce({ data: null })

    const response = await POST(mockRequest as NextRequest)
    const data = await response.json()

    expect(data.streak).toBe(1)
  })

  test('returns same streak when last_approach_date is today (idempotent)', async () => {
    const today = new Date().toISOString().split('T')[0]

    // Mock: user_insights shows already logged today
    mockSupabaseQuery.select.mockReturnValueOnce({
      eq: jest.fn().mockResolvedValueOnce({
        data: { streak: 5, last_approach_date: today },
      }),
    })

    // Mock: upsert succeeds
    mockSupabaseQuery.upsert.mockResolvedValueOnce({ data: null })

    const response = await POST(mockRequest as NextRequest)
    const data = await response.json()

    expect(data.streak).toBe(5) // No increment
  })

  test('increments streak when last_approach_date is yesterday', async () => {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const todayStr = today.toISOString().split('T')[0]

    // Mock: user_insights shows yesterday's date with streak 5
    mockSupabaseQuery.select.mockReturnValueOnce({
      eq: jest.fn().mockResolvedValueOnce({
        data: { streak: 5, last_approach_date: yesterdayStr },
      }),
    })

    // Mock: upsert succeeds
    mockSupabaseQuery.upsert.mockResolvedValueOnce({ data: null })

    const response = await POST(mockRequest as NextRequest)
    const data = await response.json()

    expect(data.streak).toBe(6) // Incremented
  })

  test('resets streak to 1 when gap > 1 day', async () => {
    const today = new Date()
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0]

    // Mock: user_insights shows 3 days ago with streak 10
    mockSupabaseQuery.select.mockReturnValueOnce({
      eq: jest.fn().mockResolvedValueOnce({
        data: { streak: 10, last_approach_date: threeDaysAgoStr },
      }),
    })

    // Mock: upsert succeeds
    mockSupabaseQuery.upsert.mockResolvedValueOnce({ data: null })

    const response = await POST(mockRequest as NextRequest)
    const data = await response.json()

    expect(data.streak).toBe(1) // Reset
  })

  test('returns 400 for unknown action', async () => {
    ;(mockRequest.json as jest.Mock).mockResolvedValueOnce({ action: 'unknown' })

    const response = await POST(mockRequest as NextRequest)
    expect(response.status).toBe(400)
  })
})
