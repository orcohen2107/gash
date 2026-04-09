import { NextRequest } from 'next/server'
import { createServiceClient } from './supabase'

export interface AuthResult {
  userId: string
}

export class UnauthorizedError extends Error {
  readonly statusCode = 401
  readonly code = 'UNAUTHORIZED'

  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header')
  }

  const token = authHeader.slice(7)
  const supabase = createServiceClient()

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new UnauthorizedError('Invalid or expired token')
  }

  return { userId: user.id }
}
