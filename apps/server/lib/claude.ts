import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL_HAIKU, CLAUDE_MODEL_SONNET } from '@gash/constants'

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY! })

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ClaudeCallOptions {
  model?: typeof CLAUDE_MODEL_HAIKU | typeof CLAUDE_MODEL_SONNET
  system: string
  messages: ClaudeMessage[]
  maxTokens?: number
  jsonPrefill?: boolean
}

export async function callClaude(options: ClaudeCallOptions): Promise<string> {
  const {
    model = CLAUDE_MODEL_HAIKU,
    system,
    messages,
    maxTokens = 1024,
    jsonPrefill = false,
  } = options

  const messagesWithPrefill: ClaudeMessage[] = jsonPrefill
    ? [...messages, { role: 'assistant', content: '{' }]
    : messages

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: messagesWithPrefill,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  return jsonPrefill ? '{' + text : text
}
