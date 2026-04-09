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
  onAuthError?: () => Promise<void>
}

class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnauthorizedError'
  }
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

  if (response.status === 401) {
    if (config.onAuthError) {
      await config.onAuthError()
    }
    throw new UnauthorizedError('Authentication failed. Please sign in again.')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }))
    throw new Error(error.error?.message ?? response.statusText)
  }

  return response.json() as Promise<TRes>
}

async function get<TRes>(config: ApiClientConfig, path: string): Promise<TRes> {
  const headers = await config.getHeaders()
  const response = await fetch(`${config.serverUrl}${path}`, { method: 'GET', headers })

  if (response.status === 401) {
    if (config.onAuthError) {
      await config.onAuthError()
    }
    throw new UnauthorizedError('Authentication failed. Please sign in again.')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }))
    throw new Error(error.error?.message ?? response.statusText)
  }

  return response.json() as Promise<TRes>
}

async function put<TReq, TRes>(
  config: ApiClientConfig,
  path: string,
  body: TReq
): Promise<TRes> {
  const headers = await config.getHeaders()
  const response = await fetch(`${config.serverUrl}${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  })

  if (response.status === 401) {
    if (config.onAuthError) {
      await config.onAuthError()
    }
    throw new UnauthorizedError('Authentication failed. Please sign in again.')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }))
    throw new Error(error.error?.message ?? response.statusText)
  }

  return response.json() as Promise<TRes>
}

async function del(config: ApiClientConfig, path: string): Promise<void> {
  const headers = await config.getHeaders()
  const response = await fetch(`${config.serverUrl}${path}`, { method: 'DELETE', headers })

  if (response.status === 401) {
    if (config.onAuthError) {
      await config.onAuthError()
    }
    throw new UnauthorizedError('Authentication failed. Please sign in again.')
  }

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
    list: (filters?: { approach_type?: string; startDate?: string; endDate?: string; search?: string }) => Promise<{ approaches: Approach[] }>
    create: (approach: Omit<Approach, 'id' | 'user_id' | 'created_at'>) => Promise<{ id: string; feedback: string; created_at: string }>
    update: (id: string, updates: Partial<Approach>) => Promise<Approach>
    delete: (id: string) => Promise<void>
    get: (id: string) => Promise<Approach>
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
      list: (filters) => {
        const params = new URLSearchParams()
        if (filters?.approach_type) params.append('approach_type', filters.approach_type)
        if (filters?.startDate) params.append('startDate', filters.startDate)
        if (filters?.endDate) params.append('endDate', filters.endDate)
        if (filters?.search) params.append('search', filters.search)
        const query = params.toString()
        return get(config, `/api/approaches${query ? `?${query}` : ''}`)
      },
      create: (approach) => post(config, '/api/approaches', approach),
      update: (id, updates) => put(config, `/api/approaches/${id}`, updates),
      delete: (id) => del(config, `/api/approaches/${id}`),
      get: (id) => get(config, `/api/approaches/${id}`),
    },
    insights: {
      get: () => get(config, '/api/insights'),
    },
  }
}
