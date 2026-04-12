const mockVerifyAuth = jest.fn()
const mockSupabaseAdmin = {
  from: jest.fn(),
  storage: {
    from: jest.fn(),
  },
}
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

jest.mock('@/lib/auth', () => ({
  UnauthorizedError: class UnauthorizedError extends Error {},
  verifyAuth: mockVerifyAuth,
}))

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: mockSupabaseAdmin,
}))

jest.mock('@/lib/logger', () => ({
  getRequestLogContext: jest.fn(() => ({})),
  logger: mockLogger,
}))

import { NextRequest } from 'next/server'
import { POST } from '../app/api/user/avatar/route'

function avatarRequest(body: unknown) {
  return new NextRequest('http://localhost/api/user/avatar', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('/api/user/avatar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Date, 'now').mockReturnValue(1_765_452_800_000)
    mockVerifyAuth.mockResolvedValue({ userId: 'user-1' })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('uploads a new avatar and removes the previous user-owned avatar', async () => {
    const oldUrl =
      'https://project.supabase.co/storage/v1/object/public/avatars/user-1/old%20avatar.jpg'
    const usersQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { avatar_url: oldUrl }, error: null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }
    const upload = jest.fn().mockResolvedValue({ error: null })
    const remove = jest.fn().mockResolvedValue({ error: null })
    mockSupabaseAdmin.from.mockReturnValue(usersQuery)
    mockSupabaseAdmin.storage.from.mockReturnValue({
      upload,
      remove,
      getPublicUrl: jest.fn(() => ({
        data: {
          publicUrl:
            'https://project.supabase.co/storage/v1/object/public/avatars/user-1/1765452800000.jpg',
        },
      })),
    })

    const response = await POST(
      avatarRequest({
        base64: Buffer.alloc(120).toString('base64'),
        mime: 'image/jpeg',
      })
    )
    const body = await response.json()

    expect(upload).toHaveBeenCalledWith(
      'user-1/1765452800000.jpg',
      expect.any(Buffer),
      expect.objectContaining({ contentType: 'image/jpeg', upsert: true })
    )
    expect(remove).toHaveBeenCalledWith(['user-1/old avatar.jpg'])
    expect(body).toEqual({
      ok: true,
      avatar_url:
        'https://project.supabase.co/storage/v1/object/public/avatars/user-1/1765452800000.jpg',
    })
  })

  it('removes the newly uploaded object when the profile update fails', async () => {
    const usersQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { avatar_url: null }, error: null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: { message: 'db failed' } }),
      }),
    }
    const remove = jest.fn().mockResolvedValue({ error: null })
    mockSupabaseAdmin.from.mockReturnValue(usersQuery)
    mockSupabaseAdmin.storage.from.mockReturnValue({
      upload: jest.fn().mockResolvedValue({ error: null }),
      remove,
      getPublicUrl: jest.fn(() => ({
        data: {
          publicUrl:
            'https://project.supabase.co/storage/v1/object/public/avatars/user-1/1765452800000.jpg',
        },
      })),
    })

    const response = await POST(
      avatarRequest({
        base64: Buffer.alloc(120).toString('base64'),
        mime: 'image/jpeg',
      })
    )

    expect(remove).toHaveBeenCalledWith(['user-1/1765452800000.jpg'])
    expect(response.status).toBe(500)
  })
})
