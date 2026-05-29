const CSRF_COOKIE = 'csrf_token'
const CSRF_HEADER = 'X-CSRF-Token'

function getCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null
  for (const part of document.cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === CSRF_COOKIE) return rest.join('=')
  }
  return null
}

export function getCsrfHeaders(): Record<string, string> {
  const token = getCsrfCookie()
  return token ? { [CSRF_HEADER]: token } : {}
}

let fetchPromise: Promise<void> | null = null

export function ensureCsrfToken(): Promise<void> {
  if (getCsrfCookie()) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/csrf', { method: 'GET', credentials: 'include' })
    .then(() => {})
    .catch(() => {})
  return fetchPromise
}
