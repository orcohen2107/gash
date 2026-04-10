import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { handleApiError } from '@/lib/apiError'

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

    const { data, error } = await supabaseAdmin.rpc('fn_registration_precheck', {
      p_phone: phone,
      p_email: email,
    })

    if (error) throw new Error(error.message)

    return NextResponse.json(data ?? { ok: false, code: 'UNKNOWN' })
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
    return handleApiError(err)
  }
}
