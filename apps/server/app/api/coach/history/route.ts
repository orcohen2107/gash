import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { handleApiError } from '@/lib/apiError'
import type { ChatMessage } from '@gash/types'

const HISTORY_LIMIT = 50

export async function GET(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request)
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, user_id, role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(HISTORY_LIMIT)

    if (error) throw error

    const messages: ChatMessage[] = data ?? []
    return NextResponse.json({ messages })
  } catch (error) {
    return handleApiError(error)
  }
}
