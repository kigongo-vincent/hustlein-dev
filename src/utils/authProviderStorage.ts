const KEY = 'hustle_auth_provider'

export type StoredAuthProvider = 'google' | 'password'

export function setAuthProvider(p: StoredAuthProvider): void {
  try {
    localStorage.setItem(KEY, p)
  } catch {
    // ignore (privacy mode / SSR)
  }
}

export function clearAuthProvider(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

export function getStoredAuthProvider(): StoredAuthProvider | null {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'google' || v === 'password') return v
  } catch {
    // ignore
  }
  return null
}

/** Best-effort JWT payload read (no signature verify). */
export function getGoogleAuthFromJwt(token: string | undefined): boolean {
  if (!token) return false
  try {
    const [, payload] = token.split('.')
    if (!payload) return false
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(normalized)
    const p = JSON.parse(json) as Record<string, unknown>
    const auth = String(p.auth_provider ?? p.authProvider ?? p.provider ?? p.oauth_provider ?? '').toLowerCase()
    if (auth.includes('google')) return true
    if (p.google_id || p.googleId) return true
    if (String(p.oauth_provider ?? '').toLowerCase() === 'google') return true
  } catch {
    // ignore
  }
  return false
}

/** When session is restored and storage is empty, persist Google from token claims. */
export function syncAuthProviderFromToken(token: string | undefined): void {
  if (!token) return
  if (getStoredAuthProvider()) return
  if (getGoogleAuthFromJwt(token)) setAuthProvider('google')
}
