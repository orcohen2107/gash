import { NextRequest } from 'next/server'

type LogLevel = 'info' | 'warn' | 'error'
type LogFields = Record<string, unknown>

const SENSITIVE_FIELD_PATTERNS = [
  'authorization',
  'base64',
  'body',
  'content',
  'email',
  'notes',
  'phone',
  'token',
]

function shouldRedact(key: string): boolean {
  const normalizedKey = key.toLowerCase()
  return SENSITIVE_FIELD_PATTERNS.some((pattern) => normalizedKey.includes(pattern))
}

function maskIdentifier(value: string): string {
  if (value.length <= 8) return value
  return `${value.slice(0, 8)}...`
}

function serializeError(error: unknown): LogFields {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return { message: String(error) }
}

function sanitizeFields(fields: LogFields): LogFields {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => {
      if (value === undefined) return [key, undefined]
      if (shouldRedact(key)) return [key, '[REDACTED]']
      if (key === 'userId' && typeof value === 'string') return [key, maskIdentifier(value)]
      if (key === 'error') return [key, serializeError(value)]
      return [key, value]
    })
  )
}

function writeLog(level: LogLevel, event: string, fields: LogFields = {}) {
  const payload = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...sanitizeFields(fields),
  }

  const serializedPayload = JSON.stringify(payload)

  if (level === 'error') {
    console.error(serializedPayload)
    return
  }

  if (level === 'warn') {
    console.warn(serializedPayload)
    return
  }

  console.info(serializedPayload)
}

export const logger = {
  info: (event: string, fields?: LogFields) => writeLog('info', event, fields),
  warn: (event: string, fields?: LogFields) => writeLog('warn', event, fields),
  error: (event: string, fields?: LogFields) => writeLog('error', event, fields),
}

export function getRequestLogContext(request: NextRequest, route: string): LogFields {
  return {
    route,
    method: request.method,
    requestId: request.headers.get('x-vercel-id') ?? request.headers.get('x-request-id') ?? undefined,
  }
}
