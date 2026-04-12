import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { handleApiError } from '@/lib/apiError'
import { getRequestLogContext, logger } from '@/lib/logger'

const bodySchema = z.object({
  phone: z.string().min(10),
  /** חובה בהרשמה — מסך ההתחברות לא שולח שדה זה */
  email: z.string().min(1).email().max(254),
})

/**
 * לפני signInWithOtp — בודק התנגשות אימייל/טלפון (ללא JWT).
 * התחברות בפועל נשארת SMS + קוד OTP בלבד.
 */
export async function POST(request: NextRequest) {
  try {
    const raw = await request.json()
    const parsed = bodySchema.parse(raw)

    let phone = parsed.phone.replace(/\s/g, '')
    if (phone.startsWith('0')) phone = '+972' + phone.slice(1)
    else if (!phone.startsWith('+972')) phone = '+972' + phone

    const email = parsed.email.trim().toLowerCase()

    const { data: phoneUser, error: phoneError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()
    if (phoneError) throw new Error(phoneError.message)

    const { data: emailUser, error: emailError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    if (emailError) throw new Error(emailError.message)

    if (emailUser && (!phoneUser || emailUser.id !== phoneUser.id)) {
      logger.info('auth.registration_checked', {
        ...getRequestLogContext(request, '/api/auth/check-registration'),
        resultCode: 'EMAIL_TAKEN',
      })
      return NextResponse.json({
        ok: false,
        code: 'EMAIL_TAKEN',
        message: 'האימייל כבר רשום לחשבון קיים. התחבר דרך «התחברות» עם אותו מספר, או נסה אימייל אחר.',
      })
    }

    if (phoneUser) {
      logger.info('auth.registration_checked', {
        ...getRequestLogContext(request, '/api/auth/check-registration'),
        resultCode: 'PHONE_EXISTS',
      })
      return NextResponse.json({
        ok: true,
        code: 'PHONE_EXISTS',
        message: 'המספר כבר רשום — נשלח קוד SMS. אם כבר יש לך חשבון, זו התחברות (לא יוצרים כפילות).',
      })
    }

    logger.info('auth.registration_checked', {
      ...getRequestLogContext(request, '/api/auth/check-registration'),
      resultCode: 'NEW',
    })

    return NextResponse.json({ ok: true, code: 'NEW', message: '' })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const first = err.issues[0]
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'פרטים לא תקינים',
            details: first ? `${first.path.join('.')}: ${first.message}` : '',
          },
        },
        { status: 400 }
      )
    }
    return handleApiError(err, getRequestLogContext(request, '/api/auth/check-registration'))
  }
}
