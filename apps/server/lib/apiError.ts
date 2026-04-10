import { NextResponse } from 'next/server'
import { UnauthorizedError } from './auth'

export function handleApiError(error: unknown): NextResponse {
  if (!(error instanceof UnauthorizedError) && !(error instanceof SyntaxError)) {
    console.error('[API Error]', error)
  }

  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: 401 }
    )
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' } },
      { status: 400 }
    )
  }

  const message = error instanceof Error ? error.message : 'Unknown error'
  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message } },
    { status: 500 }
  )
}
