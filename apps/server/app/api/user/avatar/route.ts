import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'
import { handleApiError } from '@/lib/apiError'

const bodySchema = z.object({
  base64: z.string().min(100).max(4_000_000),
  mime: z.enum(['image/jpeg', 'image/png', 'image/webp']),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request)
    const body = bodySchema.parse(await request.json())
    const buffer = Buffer.from(body.base64, 'base64')
    if (buffer.length < 100 || buffer.length > 2_000_000) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'גודל תמונה לא תקין' } },
        { status: 400 }
      )
    }

    const ext = body.mime === 'image/png' ? 'png' : body.mime === 'image/webp' ? 'webp' : 'jpg'
    const path = `${userId}/${Date.now()}.${ext}`

    const { error: upErr } = await supabaseAdmin.storage.from('avatars').upload(path, buffer, {
      contentType: body.mime,
      upsert: true,
    })
    if (upErr) throw new Error(upErr.message)

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('avatars').getPublicUrl(path)

    const { error: dbErr } = await supabaseAdmin
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)

    if (dbErr) throw new Error(dbErr.message)

    return NextResponse.json({ ok: true, avatar_url: publicUrl })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'בקשה לא תקינה' } },
        { status: 400 }
      )
    }
    return handleApiError(err)
  }
}
