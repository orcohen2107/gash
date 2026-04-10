import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, UnauthorizedError } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(2).max(50),
  age: z.number().int().min(16).max(100),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request)
    const body = await request.json()
    const { name, age } = profileSchema.parse(body)

    const { error } = await supabaseAdmin
      .from('users')
      .upsert({ id: userId, name, age }, { onConflict: 'id' })

    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: { message: err.message } }, { status: 401 })
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: { message: 'פרטים לא תקינים' } }, { status: 400 })
    }
    return NextResponse.json({ error: { message: 'שגיאת שרת' } }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request)

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('name, age')
      .eq('id', userId)
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ profile: data })
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: { message: err.message } }, { status: 401 })
    }
    return NextResponse.json({ error: { message: 'שגיאת שרת' } }, { status: 500 })
  }
}
