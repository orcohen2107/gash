import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL_HAIKU, CLAUDE_MODEL_SONNET } from '@gash/constants'
import { z } from 'zod'
import { logger } from './logger'

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
  logContext?: Record<string, unknown>
}

interface ClaudeUsage {
  input_tokens?: number
  output_tokens?: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
}

export async function callClaude(options: ClaudeCallOptions): Promise<string> {
  const {
    model = CLAUDE_MODEL_HAIKU,
    system,
    messages,
    maxTokens = 1024,
    jsonPrefill = false,
    logContext = {},
  } = options
  const startedAt = Date.now()

  const messagesWithPrefill: ClaudeMessage[] = jsonPrefill
    ? [...messages, { role: 'assistant', content: '{' }]
    : messages

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages: messagesWithPrefill,
    })

    const usage = response.usage as ClaudeUsage | undefined
    logger.info('claude.call_completed', {
      ...logContext,
      model,
      maxTokens,
      jsonPrefill,
      latencyMs: Date.now() - startedAt,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
      cacheCreationInputTokens: usage?.cache_creation_input_tokens,
      cacheReadInputTokens: usage?.cache_read_input_tokens,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    return jsonPrefill ? '{' + text : text
  } catch (error) {
    logger.error('claude.call_failed', {
      ...logContext,
      model,
      maxTokens,
      jsonPrefill,
      latencyMs: Date.now() - startedAt,
      error,
    })
    throw error
  }
}

export async function callClaudeJSON<T>(
  options: ClaudeCallOptions & {
    schema: z.ZodType<T>
    fallback: T
  }
): Promise<T> {
  try {
    const text = await callClaude({ ...options, jsonPrefill: true })
    const parsed = JSON.parse(text)
    return options.schema.parse(parsed)
  } catch (error) {
    logger.warn('claude.json_fallback_used', {
      ...options.logContext,
      error,
    })
    return options.fallback
  }
}
