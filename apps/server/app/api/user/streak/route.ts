import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { handleApiError } from '@/lib/apiError'

const StreakRequestSchema = z.object({
  action: z.enum(['increment']),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = StreakRequestSchema.parse(body)
    const { action } = validated

    if (action === 'increment') {
      // Get user's last approach date
      const { data: lastApproach } = await supabaseAdmin
        .from('approaches')
        .select('date')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)

      // Get current user streak
      const { data: userInsights } = await supabaseAdmin
        .from('user_insights')
        .select('streak, last_approach_date')
        .eq('user_id', userId)
        .single()

      const today = new Date().toISOString().split('T')[0]
      const lastApproachDate = userInsights?.last_approach_date
      const currentStreak = userInsights?.streak || 0

      let newStreak = currentStreak

      // Check if already logged today
      if (lastApproachDate === today) {
        // Already logged today, don't increment
        newStreak = currentStreak
      } else if (lastApproachDate) {
        // Check for gap
        const lastDate = new Date(lastApproachDate)
        const todayDate = new Date(today)
        const daysDiff = Math.floor(
          (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysDiff === 1) {
          // Consecutive day, increment
          newStreak = currentStreak + 1
        } else if (daysDiff > 1) {
          // Gap in streak, reset to 1
          newStreak = 1
        }
      } else {
        // First approach ever
        newStreak = 1
      }

      // Update user_insights with new streak and date
      await supabaseAdmin
        .from('user_insights')
        .upsert({
          user_id: userId,
          streak: newStreak,
          last_approach_date: today,
        })

      return NextResponse.json({
        streak: newStreak,
        message: newStreak > currentStreak ? '+1 🔥' : 'משימה הושלמה',
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return handleApiError(error)
  }
}
