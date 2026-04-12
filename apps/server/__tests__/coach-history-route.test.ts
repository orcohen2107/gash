const mockVerifyAuth = jest.fn()
const mockCreateServiceClient = jest.fn()

jest.mock('@/lib/auth', () => ({
  UnauthorizedError: class UnauthorizedError extends Error {},
  verifyAuth: mockVerifyAuth,
}))

jest.mock('@/lib/supabase', () => ({
  createServiceClient: mockCreateServiceClient,
}))

import { NextRequest } from 'next/server'
import { DELETE, GET } from '../app/api/coach/history/route'

describe('/api/coach/history', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockVerifyAuth.mockResolvedValue({ userId: 'user-1' })
  })

  it('returns a chronological page with a next cursor', async () => {
    const query = {
      data: [
        {
          id: 'msg-3',
          user_id: 'user-1',
          role: 'assistant',
          content: 'חדש',
          created_at: '2026-04-12T10:00:00.000Z',
        },
        {
          id: 'msg-2',
          user_id: 'user-1',
          role: 'user',
          content: 'אמצע',
          created_at: '2026-04-12T09:00:00.000Z',
        },
        {
          id: 'msg-1',
          user_id: 'user-1',
          role: 'assistant',
          content: 'ישן',
          created_at: '2026-04-12T08:00:00.000Z',
        },
      ],
      error: null,
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
    }
    mockCreateServiceClient.mockReturnValue({
      from: jest.fn(() => query),
    })

    const response = await GET(
      new NextRequest('http://localhost/api/coach/history?before=2026-04-12T11%3A00%3A00.000Z&limit=2')
    )
    const body = await response.json()

    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(query.limit).toHaveBeenCalledWith(3)
    expect(query.lt).toHaveBeenCalledWith('created_at', '2026-04-12T11:00:00.000Z')
    expect(body.messages.map((message: { id: string }) => message.id)).toEqual(['msg-2', 'msg-3'])
    expect(body.nextCursor).toBe('2026-04-12T09:00:00.000Z')
    expect(body.hasMore).toBe(true)
  })

  it('deletes only the authenticated user chat messages', async () => {
    const eqMock = jest.fn().mockReturnValue({ error: null })
    const deleteMock = jest.fn().mockReturnValue({ eq: eqMock })
    const fromMock = jest.fn(() => ({ delete: deleteMock }))
    mockCreateServiceClient.mockReturnValue({ from: fromMock })

    const response = await DELETE(
      new NextRequest('http://localhost/api/coach/history', { method: 'DELETE' })
    )

    expect(fromMock).toHaveBeenCalledWith('chat_messages')
    expect(deleteMock).toHaveBeenCalledTimes(1)
    expect(eqMock).toHaveBeenCalledWith('user_id', 'user-1')
    expect(response.status).toBe(204)
  })
})
