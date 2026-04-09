import type {
  CoachRequest,
  CoachResponse,
  OnboardingRequest,
  OnboardingResponse,
  ReplyCoachRequest,
  ReplyCoachResponse,
  SituationOpenerRequest,
  SituationOpenerResponse,
  ApproachFeedbackRequest,
  ApproachFeedbackResponse,
  DebriefRequest,
  DebriefResponse,
  BoostRequest,
  BoostResponse,
  Approach,
  ChatMessage,
  InsightsResponse,
} from '@gash/types'

interface ApiClientConfig {
  serverUrl: string
  getHeaders: () => Promise<HeadersInit>
}

async function post<TReq, TRes>(
  config: ApiClientConfig,
  path: string,
  body: TReq
): Promise<TRes> {
  const headers = await config.getHeaders()
  const response = await fetch(`${config.serverUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }))
    throw new Error(error.error?.message ?? response.statusText)
  }

  return response.json() as Promise<TRes>
}

async function get<TRes>(config: ApiClientConfig, path: string): Promise<TRes> {
  const headers = await config.getHeaders()
  const response = await fetch(`${config.serverUrl}${path}`, { method: 'GET', headers })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }))
    throw new Error(error.error?.message ?? response.statusText)
  }

  return response.json() as Promise<TRes>
}

async function del(config: ApiClientConfig, path: string): Promise<void> {
  const headers = await config.getHeaders()
  const response = await fetch(`${config.serverUrl}${path}`, { method: 'DELETE', headers })
  if (!response.ok && response.status !== 204) {
    throw new Error(`DELETE ${path} failed: ${response.statusText}`)
  }
}

export interface ApiClient {
  coach: {
    send: (req: CoachRequest) => Promise<CoachResponse>
    boost: (req: BoostRequest) => Promise<BoostResponse>
    onboarding: (req: OnboardingRequest) => Promise<OnboardingResponse>
    reply: (req: ReplyCoachRequest) => Promise<ReplyCoachResponse>
    opener: (req: SituationOpenerRequest) => Promise<SituationOpenerResponse>
    feedback: (req: ApproachFeedbackRequest) => Promise<ApproachFeedbackResponse>
    debrief: (req: DebriefRequest) => Promise<DebriefResponse>
    history: () => Promise<{ messages: ChatMessage[] }>
  }
  approaches: {
    list: () => Promise<{ approaches: Approach[] }>
    create: (approach: Omit<Approach, 'id' | 'user_id' | 'created_at'>) => Promise<{ approach: Approach }>
    update: (id: string, updates: Partial<Approach>) => Promise<{ approach: Approach }>
    remove: (id: string) => Promise<void>
  }
  insights: {
    get: () => Promise<{ insights: InsightsResponse }>
  }
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  return {
    coach: {
      send: (req) => post(config, '/api/coach', req),
      boost: (req) => post(config, '/api/coach', req),
      onboarding: (req) => post(config, '/api/coach/onboarding', req),
      reply: (req) => post(config, '/api/coach/reply', req),
      opener: (req) => post(config, '/api/coach/opener', req),
      feedback: (req) => post(config, '/api/coach', req),
      debrief: (req) => post(config, '/api/coach', req),
      history: () => get(config, '/api/coach/history'),
    },
    approaches: {
      list: () => get(config, '/api/approaches'),
      create: (approach) => post(config, '/api/approaches', approach),
      update: (id, updates) => post(config, `/api/approaches/${id}`, updates),
      remove: (id) => del(config, `/api/approaches/${id}`),
    },
    insights: {
      get: () => get(config, '/api/insights'),
    },
  }
}
