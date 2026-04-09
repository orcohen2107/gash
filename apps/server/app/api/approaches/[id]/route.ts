import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { handleApiError } from '@/lib/apiError'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await verifyAuth(request)
    const { id } = await params
    const body = await request.json()
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('approaches')
      .update(body)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Approach not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ approach: data })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await verifyAuth(request)
    const { id } = await params
    const supabase = createServiceClient()

    const { error } = await supabase
      .from('approaches')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
