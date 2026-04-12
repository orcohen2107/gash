import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { handleApiError } from '@/lib/apiError'
import { getRequestLogContext, logger } from '@/lib/logger'
import type { ChatMessage } from '@gash/types'

const HISTORY_LIMIT = 50
const MAX_HISTORY_LIMIT = 100

function parseLimit(value: string | null): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return HISTORY_LIMIT
  return Math.min(parsed, MAX_HISTORY_LIMIT)
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request)
    const supabase = createServiceClient()
    const url = new URL(request.url)
    const before = url.searchParams.get('before')
    const limit = parseLimit(url.searchParams.get('limit'))

    let query = supabase
      .from('chat_messages')
      .select('id, user_id, role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit + 1)

    if (before) query = query.lt('created_at', before)

    const { data, error } = await query

    if (error) throw error

    const rows = data ?? []
    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows
    const messages: ChatMessage[] = [...page].reverse()
    const nextCursor = hasMore ? page[page.length - 1]?.created_at ?? null : null

    return NextResponse.json({ messages, nextCursor, hasMore })
  } catch (error) {
    return handleApiError(error, getRequestLogContext(request, '/api/coach/history'))
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request)
    const supabase = createServiceClient()

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', userId)

    if (error) throw error

    logger.info('coach.history_deleted', {
      ...getRequestLogContext(request, '/api/coach/history'),
      userId,
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error, getRequestLogContext(request, '/api/coach/history'))
  }
}
