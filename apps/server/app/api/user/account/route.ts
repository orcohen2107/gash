import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { handleApiError } from '@/lib/apiError'
import { getRequestLogContext, logger } from '@/lib/logger'

/**
 * מחיקת משתמש: מוחק את רשומת ה-auth (CASCADE למסדי הנתונים הציבוריים לפי הסכמה).
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) throw new Error(error.message)
    logger.info('user.account_deleted', {
      ...getRequestLogContext(request, '/api/user/account'),
      userId,
    })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleApiError(err, getRequestLogContext(request, '/api/user/account'))
  }
}
