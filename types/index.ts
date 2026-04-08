// types/index.ts

export type ApproachType = 'direct' | 'situational' | 'humor' | 'online'
export type FollowUpType = 'meeting' | 'text' | 'instagram' | 'nothing'

export interface Approach {
  id: string
  user_id: string
  date: string            // ISO date string: '2026-04-08'
  location: string | null
  approach_type: ApproachType
  opener: string | null
  response: string | null
  chemistry_score: number | null  // 1-10
  follow_up: FollowUpType | null
  notes: string | null
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
  title: string           // Hebrew
  description: string     // Hebrew
  target_count: number
  week_identifier: string // ISO week: '2026-W15'
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
