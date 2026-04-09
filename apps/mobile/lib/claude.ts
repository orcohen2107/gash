import { supabase } from '@/lib/supabase'
import type { ChatMessage } from '@/types'

interface CoachResult {
  success: boolean
  content?: string
  error?: string
}

type ClaudeMessage = Pick<ChatMessage, 'role' | 'content'>

export async function callCoach(messages: ClaudeMessage[]): Promise<CoachResult> {
  try {
    const { data, error } = await supabase.functions.invoke('ask-coach', {
      body: { messages },
    })

    if (error) throw error
    if (!data?.content) throw new Error('תגובה ריקה מהמאמן')

    return { success: true, content: data.content }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'שגיאה לא ידועה',
    }
  }
}
