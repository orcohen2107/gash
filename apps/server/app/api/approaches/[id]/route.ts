import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { handleApiError } from '@/lib/apiError'
import { UpdateApproachSchema } from '@gash/schemas'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await verifyAuth(request)
    const { id } = await params
    const body = await request.json()
    const parsed = UpdateApproachSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('approaches')
      .update(parsed.data)
      .eq('id', id)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select()
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Approach not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await verifyAuth(request)
    const { id } = await params
    const supabase = createServiceClient()

    // Soft delete: set deleted_at timestamp
    const { error } = await supabase
      .from('approaches')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
