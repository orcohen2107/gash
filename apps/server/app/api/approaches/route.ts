import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { handleApiError } from '@/lib/apiError'
import { CreateApproachSchema } from '@gash/schemas'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request)
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('approaches')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) throw new Error(error.message)

    return NextResponse.json({ approaches: data })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request)
    const body = await request.json()
    const parsed = CreateApproachSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('approaches')
      .insert({ ...parsed.data, user_id: userId })
      .select()
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ approach: data }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
