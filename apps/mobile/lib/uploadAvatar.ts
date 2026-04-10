import { SERVER_URL, getAuthHeaders } from '@/lib/server'

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'] as const

export async function uploadAvatarBase64(
  base64: string,
  mime: string
): Promise<{ avatar_url: string }> {
  const m = ALLOWED.includes(mime as (typeof ALLOWED)[number])
    ? (mime as (typeof ALLOWED)[number])
    : 'image/jpeg'
  const headers = await getAuthHeaders()
  const res = await fetch(`${SERVER_URL}/api/user/avatar`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64, mime: m }),
  })
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; avatar_url?: string; error?: unknown }
  if (!res.ok || !json.avatar_url) {
    throw new Error(typeof json.error === 'object' && json.error !== null ? JSON.stringify(json.error) : 'upload failed')
  }
  return { avatar_url: json.avatar_url }
}
