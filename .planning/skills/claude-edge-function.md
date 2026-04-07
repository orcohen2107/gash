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
  const { type: explicitType, messages: clientMessages, body } = await req.json()

  // 3. Detect intent — routing happens HERE, not in Claude
  const { detectIntent } = await import('./intentRouter.ts')
  const type = detectIntent(body?.text ?? '', explicitType)

  // 4. Build user context
  const userProfile = await buildUserContext(user.id, supabase)

  // 5. Fetch chat history for coach/debrief (Claude doesn't remember between calls)
  let messages = clientMessages
  if (['coach', 'debrief'].includes(type) && !clientMessages) {
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .order('created_at', { ascending: true })
      .limit(15)
    messages = [
      ...(history ?? []),
      { role: 'user', content: body?.text }
    ]
  }

  // 6. Route to correct prompt
  const systemPrompt = buildSystemPrompt(type, userProfile, body)

  // 7. Call Claude — JSON agents use prefill
  const isJsonAgent = ['approach-feedback', 'insights', 'reply-coach', 'situation-opener', 'onboarding'].includes(type)
  const finalMessages = isJsonAgent
    ? [...messages, { role: 'assistant', content: '{' }]
    : messages

  const response = await claude.messages.create({
    model: MODEL_OVERRIDES[type] ?? 'claude-haiku-4-5-20251001',
    max_tokens: isJsonAgent ? 2048 : 1024,
    system: systemPrompt,
    messages: finalMessages,
  })

  // 8. Handle response — JSON agents prepend the '{' prefill
  const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
  const text = isJsonAgent ? '{' + rawText : rawText

  // 9. Save to chat_messages for conversational agents
  if (['coach', 'debrief', 'onboarding'].includes(type)) {
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
