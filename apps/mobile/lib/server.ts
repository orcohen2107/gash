import { useAuthStore } from '@/stores/useAuthStore'
import { supabase } from './supabase'
import { SERVER_URL_DEFAULT } from '@gash/constants'

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL ?? SERVER_URL_DEFAULT

export async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  }
}

export async function handleAuthError(): Promise<void> {
  // Sign out and redirect to auth
  await useAuthStore.getState().signOut()
}

export { SERVER_URL }
