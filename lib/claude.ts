// lib/claude.ts
// Client-side stub for calling the ask-coach Edge Function.
// NEVER call the Claude API directly from here — always go through the Edge Function.
// Phase 2 will expand this with proper message types and error handling.

import { supabase } from '@/lib/supabase'
import type { ChatMessage } from '@/types'

export interface CoachResponse {
  text: string
}

export async function callCoach(messages: ChatMessage[]): Promise<CoachResponse> {
  const { data, error } = await supabase.functions.invoke('ask-coach', {
    body: {
      type: 'coach',
      messages,
    },
  })

  if (error) {
    throw new Error(`Edge Function error: ${error.message}`)
  }

  return data as CoachResponse
}
