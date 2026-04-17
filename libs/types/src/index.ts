// Domain types

export interface UserProfile {
  name: string
  age: number
  email?: string | null
  /** URL ציבורי אחרי העלאה ל-Storage */
  avatar_url?: string | null
  phone?: string | null
}

export type ApproachType = 'direct' | 'situational' | 'humor' | 'online'
export type FollowUpType =
  | 'meeting'
  | 'text'
  | 'instagram'
  | 'nothing'
  | 'phone'
  | 'instant'
  | 'coffee'
  | 'kiss'
  | 'went_home'
export type DurationType = 'brief' | 'short' | 'long'

export interface Approach {
  id: string
  user_id: string
  date: string
  location: string | null
  approach_type: ApproachType
  opener: string | null
  response: string | null
  chemistry_score: number | null
  follow_up: FollowUpType | null
  notes: string | null
  duration?: DurationType | null
  was_solo?: boolean | null
  created_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface WeeklyMission {
  id: string
  title: string
  description: string
  target_count: number
  week_identifier: string
}

export interface OnboardingData {
  initialStyle: ApproachType
  mainChallenge: string
  preferredLocations: string[]
}

export interface UserInsights {
  user_id: string
  weekly_mission: WeeklyMission | null
  missions_completed: number
  streak: number
  last_analysis_at: string | null
  onboarding_data: OnboardingData | null
  updated_at: string
}

// API request / response types

export interface CoachRequest {
  type: 'coach'
  messages: Pick<ChatMessage, 'role' | 'content'>[]
}

export interface OnboardingRequest {
  type: 'onboarding'
  messages: Pick<ChatMessage, 'role' | 'content'>[]
  onboardingStep: 1 | 2 | 3 | 4
}

export interface ReplyCoachRequest {
  type: 'reply-coach'
  herMessage?: string
  thread?: { sender: string; text: string }[]
  context?: { where?: string; duration?: string; goal?: string }
}

export interface SituationOpenerRequest {
  type: 'situation-opener'
  situation: string
  context?: string
}

export interface ApproachFeedbackRequest {
  type: 'approach-feedback'
  approach: Pick<Approach, 'approach_type' | 'opener' | 'response' | 'chemistry_score' | 'follow_up'>
}

export interface DebriefRequest {
  type: 'debrief'
  approach: Pick<Approach, 'approach_type' | 'opener' | 'response' | 'chemistry_score'>
  debriefStep: 1 | 2
  messages?: Pick<ChatMessage, 'role' | 'content'>[]
}

export interface BoostRequest {
  type: 'boost'
  situation: string
}

export interface InsightsRequest {
  type: 'insights'
}

export type AgentRequest =
  | CoachRequest
  | OnboardingRequest
  | ReplyCoachRequest
  | SituationOpenerRequest
  | ApproachFeedbackRequest
  | DebriefRequest
  | BoostRequest
  | InsightsRequest

// API responses

export interface CoachResponse {
  text: string
}

export interface OnboardingStepResponse {
  text: string
  onboardingComplete: false
}

export interface OnboardingCompleteResponse {
  initialStyle: ApproachType
  mainChallenge: string
  preferredLocations: string[]
  motivation: string
  onboardingComplete: true
}

export type OnboardingResponse = OnboardingStepResponse | OnboardingCompleteResponse

export interface ReplyAnalysis {
  tone: string
  intent: string
  signal: 'חיובי' | 'ניטרלי' | 'שלילי'
  summary: string
}

export interface PreparedReply {
  style: string
  text: string
  why: string
}

export interface ReplyCoachResponse {
  analysis: ReplyAnalysis
  replies: [PreparedReply, PreparedReply, PreparedReply]
  warning: string | null
}

export interface Opener {
  style: string
  text: string
  followUp: string
}

export interface SituationOpenerResponse {
  openers: [Opener, Opener, Opener]
  tip: string
}

export interface ApproachFeedbackResponse {
  feedback: string
  tip: string
  emoji: '🔥' | '👍' | '💡' | '📈'
}

export interface DebriefQuestionResponse {
  text: string
  debriefComplete: false
}

export interface DebriefDiagnosisResponse {
  diagnosis: string
  mission: string
  debriefComplete: true
}

export type DebriefResponse = DebriefQuestionResponse | DebriefDiagnosisResponse

export interface BoostResponse {
  confidence: string
  opener: string
}

export interface InsightsMission {
  title: string
  description: string
  target: number
  targetType: string
}

export interface InsightsResponse {
  insights: [string, string, string]
  weeklyMission: InsightsMission
  trend: 'עולה' | 'יורד' | 'יציב'
  trendExplanation: string
}

/** KPI למסך מדדים — מחושב בשרת (או מקומית מאותן נוסחאות) */
export interface DashboardKpis {
  totalApproaches: number
  successRate: number
  avgChemistry: number
  topApproachType: ApproachType | null
}

/** תקציר תפעולי למסך מדדים — הופך דאטה גולמי להכוונה קצרה */
export interface DashboardSummary {
  thisWeekApproaches: number
  lastWeekApproaches: number
  weeklyDelta: number
  currentStreak: number
  strongestType: ApproachType | null
  practiceType: ApproachType | null
  mostCommonFollowUp: FollowUpType | null
  highChemistryCount: number
  highChemistryRate: number
}

/** משימה שבועית בחבילת /api/dashboard */
export interface DashboardMissionPayload {
  title: string
  description: string
  target: number
  target_approach_type: ApproachType
}

/** חבילה אחת: גישות + KPI + תובנות + משימה */
export interface DashboardResponse {
  approaches: Approach[]
  kpis: DashboardKpis
  summary: DashboardSummary
  insights: InsightsResponse
  mission: DashboardMissionPayload
  streak: number
}

// User context built from approaches for AI agents
export interface UserContext {
  hasEnoughData: boolean
  totalApproaches?: number
  bestType?: ApproachType
  bestRate?: number
  worstType?: ApproachType
  avgChemistry?: string
  recentPattern?: string
  userStyle?: string
  typeSuccessRates?: Record<string, number>
}
