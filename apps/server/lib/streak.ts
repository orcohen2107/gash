import { supabaseAdmin } from '@/lib/supabase'

const APP_TIME_ZONE = 'Asia/Jerusalem'
const ONE_DAY_MS = 24 * 60 * 60 * 1000

interface UserStreakRow {
  streak: number | null
  last_approach_date: string | null
}

export function getTodayDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value ?? '1970'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'

  return `${year}-${month}-${day}`
}

function dateKeyToUtcMs(dateKey: string): number {
  const [year = '1970', month = '01', day = '01'] = dateKey.split('-')
  return Date.UTC(Number(year), Number(month) - 1, Number(day))
}

function daysBetweenDateKeys(fromDateKey: string, toDateKey: string): number {
  return Math.floor((dateKeyToUtcMs(toDateKey) - dateKeyToUtcMs(fromDateKey)) / ONE_DAY_MS)
}

export function normalizeCurrentStreak(
  row: UserStreakRow | null,
  todayDateKey = getTodayDateKey()
): number {
  const currentStreak = row?.streak ?? 0
  const lastApproachDate = row?.last_approach_date

  if (!lastApproachDate || currentStreak <= 0) {
    return 0
  }

  const daysSinceLastApproach = daysBetweenDateKeys(lastApproachDate, todayDateKey)
  if (daysSinceLastApproach > 1) {
    return 0
  }

  return currentStreak
}

export async function loadCurrentStreak(userId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('user_insights')
    .select('streak, last_approach_date')
    .eq('user_id', userId)
    .maybeSingle<UserStreakRow>()

  const normalizedStreak = normalizeCurrentStreak(data)

  if (data && normalizedStreak !== (data.streak ?? 0)) {
    await supabaseAdmin
      .from('user_insights')
      .update({ streak: normalizedStreak })
      .eq('user_id', userId)
  }

  return normalizedStreak
}

export async function incrementUserStreak(
  userId: string
): Promise<{ previousStreak: number; streak: number }> {
  const todayDateKey = getTodayDateKey()
  const { data } = await supabaseAdmin
    .from('user_insights')
    .select('streak, last_approach_date')
    .eq('user_id', userId)
    .maybeSingle<UserStreakRow>()

  const previousStreak = normalizeCurrentStreak(data, todayDateKey)
  const lastApproachDate = data?.last_approach_date

  let streak = 1
  if (lastApproachDate === todayDateKey) {
    streak = Math.max(1, previousStreak)
  } else if (lastApproachDate && daysBetweenDateKeys(lastApproachDate, todayDateKey) === 1) {
    streak = previousStreak + 1
  }

  await supabaseAdmin
    .from('user_insights')
    .upsert({
      user_id: userId,
      streak,
      last_approach_date: todayDateKey,
    })

  return { previousStreak, streak }
}
