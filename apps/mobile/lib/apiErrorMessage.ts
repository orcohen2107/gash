/**
 * קורא גוף JSON של שגיאה מהשרת (handleApiError / profile וכו')
 * ומחזיר מחרוזת אחת להצגה למשתמש / לוג.
 */
export function formatApiErrorJson(json: unknown, status: number): string {
  if (!json || typeof json !== 'object') {
    return `שגיאת שרת (${status})`
  }
  const e = (json as { error?: { message?: string; details?: string; code?: string } }).error
  if (!e) {
    return `שגיאת שרת (${status})`
  }
  const msg = e.message?.trim() ?? ''
  const det = e.details?.trim() ?? ''
  if (msg && det && msg !== det) {
    return `${msg} — ${det}`
  }
  return msg || det || `שגיאת שרת (${status})`
}
