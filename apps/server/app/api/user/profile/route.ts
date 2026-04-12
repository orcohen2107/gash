import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'
import { handleApiError } from '@/lib/apiError'
import { getRequestLogContext, logger } from '@/lib/logger'

const profileSchema = z.object({
  name: z.string().min(2).max(50),
  age: z.number().int().min(16).max(100),
  email: z.string().email().max(254),
})

export async function POST(request: NextRequest) {
  try {
    const { userId, phone } = await verifyAuth(request)
    const body = await request.json()
    const { name, age, email } = profileSchema.parse(body)
    const emailNorm = email.trim().toLowerCase()
    const row = { name, age, phone, email: emailNorm }

    const { data: exists, error: exErr } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    if (exErr) throw new Error(exErr.message)

    const { error } = exists
      ? await supabaseAdmin.from('users').update(row).eq('id', userId)
      : await supabaseAdmin.from('users').insert({ id: userId, ...row })

    if (error) throw new Error(error.message)

    logger.info('user.profile_saved', {
      ...getRequestLogContext(request, '/api/user/profile'),
      userId,
      mode: exists ? 'update' : 'insert',
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const first = err.issues[0]
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'פרטים לא תקינים',
            details: first ? `${first.path.join('.')}: ${first.message}` : err.message,
          },
        },
        { status: 400 }
      )
    }
    return handleApiError(err, getRequestLogContext(request, '/api/user/profile'))
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request)

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('name, age, phone, email, avatar_url')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw new Error(error.message)

    return NextResponse.json({ profile: data ?? null })
  } catch (err) {
    return handleApiError(err, getRequestLogContext(request, '/api/user/profile'))
  }
}
