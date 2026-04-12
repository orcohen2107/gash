const mockSupabaseAdmin = {
  from: jest.fn(),
}

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: mockSupabaseAdmin,
}))

import { NextRequest } from 'next/server'
import { POST } from '../app/api/auth/check-registration/route'

function userLookupMock(results: Array<{ data: { id: string } | null; error: null }>) {
  const maybeSingle = jest.fn()
  for (const result of results) {
    maybeSingle.mockResolvedValueOnce(result)
  }

  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle,
  }
  mockSupabaseAdmin.from.mockReturnValue(query)
  return query
}

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/check-registration', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('/api/auth/check-registration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('normalizes Israeli phone numbers and returns NEW when no user exists', async () => {
    const query = userLookupMock([
      { data: null, error: null },
      { data: null, error: null },
    ])

    const response = await POST(postRequest({ phone: '050 123 4567', email: 'USER@EXAMPLE.COM' }))
    const body = await response.json()

    expect(query.eq).toHaveBeenNthCalledWith(1, 'phone', '+972501234567')
    expect(query.eq).toHaveBeenNthCalledWith(2, 'email', 'user@example.com')
    expect(body).toEqual({ ok: true, code: 'NEW', message: '' })
  })

  it('returns PHONE_EXISTS when the phone already belongs to an account', async () => {
    userLookupMock([
      { data: { id: 'user-1' }, error: null },
      { data: { id: 'user-1' }, error: null },
    ])

    const response = await POST(postRequest({ phone: '+972501234567', email: 'user@example.com' }))
    const body = await response.json()

    expect(body.ok).toBe(true)
    expect(body.code).toBe('PHONE_EXISTS')
  })

  it('returns EMAIL_TAKEN when the email belongs to another account', async () => {
    userLookupMock([
      { data: { id: 'user-1' }, error: null },
      { data: { id: 'user-2' }, error: null },
    ])

    const response = await POST(postRequest({ phone: '+972501234567', email: 'user@example.com' }))
    const body = await response.json()

    expect(body.ok).toBe(false)
    expect(body.code).toBe('EMAIL_TAKEN')
  })
})
