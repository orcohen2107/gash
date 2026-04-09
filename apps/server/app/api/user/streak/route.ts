import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const { userId } = await verifyAuth(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { action } = await request.json()

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
  } catch (err) {
    console.error('Streak error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
