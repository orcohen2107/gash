# Skill: Claude Edge Function Pattern

מבנה נכון של `ask-coach` Edge Function עם JWT + ניתוב לפי `type`.

```ts
// supabase/functions/ask-coach/index.ts
import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js'
import { buildUserContext } from './buildUserContext.ts'

const claude = new Anthropic({ apiKey: Deno.env.get('CLAUDE_API_KEY') })

Deno.serve(async (req) => {
  // 1. JWT verify
  const authHeader = req.headers.get('Authorization')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader! } } }
  )
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return new Response('Unauthorized', { status: 401 })

  // 2. Parse request
  const { type = 'coach', messages, body } = await req.json()

  // 3. Build user context (for coach + insights)
  const userProfile = await buildUserContext(user.id, supabase)

  // 4. Route to correct prompt
  const systemPrompt = buildSystemPrompt(type, userProfile, body)

  // 5. Call Claude
  const response = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages ?? [{ role: 'user', content: body?.text }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // 6. Save to chat_messages if type === 'coach'
  if (type === 'coach') {
    await supabase.from('chat_messages').insert([
      { user_id: user.id, role: 'assistant', content: text }
    ])
  }

  return new Response(JSON.stringify({ text }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

## חוקים
- תמיד verifyJWT לפני כל פעולה
- model: `claude-haiku-4-5-20251001` בלבד
- החזר JSON רק כשה-type מחייב (profile, insights)
- שמור assistant messages רק ל-type=coach
