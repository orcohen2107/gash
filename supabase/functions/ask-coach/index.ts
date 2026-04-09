import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')!

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 300
const MESSAGE_CONTEXT_LIMIT = 15

const COACH_SYSTEM_PROMPT = `אתה גש — המאמן הדייטינג האישי שלי. אתה מכיר אותי, יודע מה עבד לי ומה לא, ומדבר איתי בגובה העיניים.

הסגנון שלך בתשובות:
- ישיר ולעניין — לא מרצה, לא מטיף
- מצחיק כשזה מתאים, רציני כשצריך
- מכיר ישראל לעומק: בסיס, רכבת, קפה, שוק, אוניברסיטה, מועדון, חוף
- תמיד נותן משהו קונקרטי לעשות — לא "תהיה עצמך"
- כשאני שואל "מה להגיד" — תן משפט מוכן, לא תיאוריה
- לא מדרבן משחקי כוח או מניפולציה — מתמקד בחיבור אמיתי

אורך תשובה: 2-4 משפטים. אם אני מבקש אפשרויות — תן 3 בדיוק, ממוספרות.
שפה: עברית בלבד. סלנג ישראלי מותר ומעודד.`

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  let userId: string
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }
    userId = user.id
  } catch {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  let requestBody: { messages?: Array<{ role: string; content: string }> }
  try {
    requestBody = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400)
  }

  const { data: historyRows, error: historyError } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MESSAGE_CONTEXT_LIMIT)

  if (historyError) {
    return jsonResponse({ error: 'Failed to fetch message history' }, 500)
  }

  const historicalMessages = (historyRows ?? [])
    .reverse()
    .map((row) => ({ role: row.role as 'user' | 'assistant', content: row.content }))

  const incomingMessages = (requestBody.messages ?? []).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const allMessages = [...historicalMessages, ...incomingMessages]

  let claudeResponse: Response
  try {
    claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        system: COACH_SYSTEM_PROMPT,
        messages: allMessages,
      }),
    })
  } catch {
    return jsonResponse({ error: 'Failed to reach Claude API' }, 500)
  }

  const claudeData = await claudeResponse.json()

  if (!claudeResponse.ok || claudeData.error) {
    return jsonResponse({ error: claudeData.error?.message ?? 'Claude API error' }, 400)
  }

  const responseText: string = claudeData.content?.[0]?.text
  if (!responseText) {
    return jsonResponse({ error: 'Empty response from Claude' }, 500)
  }

  await supabase.from('chat_messages').insert({
    user_id: userId,
    role: 'assistant',
    content: responseText,
    created_at: new Date().toISOString(),
  })

  return jsonResponse({ content: responseText }, 200)
})
