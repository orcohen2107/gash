import { NextResponse } from 'next/server'
import { UnauthorizedError } from './auth'

export function handleApiError(error: unknown): NextResponse {
  // Log non-4xx errors to Sentry (if configured)
  if (!(error instanceof UnauthorizedError) && !(error instanceof SyntaxError)) {
    if (process.env.SENTRY_DSN) {
      try {
        // Import Sentry dynamically to avoid hard dependency
        import('@sentry/nextjs').then((Sentry) => {
          Sentry.captureException(error)
        })
      } catch (err) {
        // Sentry not configured, silently continue
      }
    }
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
