import { api, endpoints, assertOk, getStoredToken, setStoredToken } from '../api'
import { Authstore } from '../data/Authstore'
import type { AuthUser } from '../types'
import { setAuthProvider, syncAuthProviderFromToken } from '../utils/authProviderStorage'

export interface LoginPayload {
  email: string
  password: string
}

export interface SignupPayload {
  email: string
  name?: string
  password: string
  role?: string
  companyId?: string
  companyName?: string
}

interface AuthResponse {
  user: AuthUser
  token: string
}

interface JwtClaims {
  userId?: string
  email?: string
  role?: string
  companyId?: string
}

function safeDecodeJwtClaims(token: string): JwtClaims | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(normalized)
    const parsed = JSON.parse(json) as JwtClaims
    return parsed
  } catch {
    return null
  }
}

function userFromTokenClaims(token: string): AuthUser | null {
  const claims = safeDecodeJwtClaims(token)
  if (!claims?.userId || !claims.email || !claims.role || !claims.companyId) return null
  const inferredName = claims.email.split('@')[0] || claims.email
  return {
    id: claims.userId,
    email: claims.email,
    name: inferredName,
    role: claims.role as AuthUser['role'],
    companyId: claims.companyId,
    token,
  }
}

async function hydrateUserFromTokenClaims(token: string): Promise<AuthUser | null> {
  const base = userFromTokenClaims(token)
  if (!base) return null
  const res = await api.get<Omit<AuthUser, 'token'>>(endpoints.user(base.id))
  if (!res.ok) return base
  return { ...(res.data as Omit<AuthUser, 'token'>), token }
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthUser> {
    const res = await api.post<AuthResponse>(endpoints.auth.login(), payload)
    const body = assertOk(res)
    const authUser: AuthUser = { ...body.user, token: body.token }
    setStoredToken(body.token)
    setAuthProvider('password')
    Authstore.getState().setUser(authUser)
    return authUser
  },

  async signup(payload: SignupPayload): Promise<AuthUser> {
    const res = await api.post<AuthResponse>(endpoints.auth.signup(), payload)
    const body = assertOk(res)
    const authUser: AuthUser = { ...body.user, token: body.token }
    setStoredToken(body.token)
    setAuthProvider('password')
    Authstore.getState().setUser(authUser)
    return authUser
  },

  async googleAuth(accessToken: string): Promise<AuthUser> {
    const res = await api.post<AuthResponse>(endpoints.auth.google(), {
      access_token: accessToken,
    })
    const body = assertOk(res)
    const authUser: AuthUser = { ...body.user, token: body.token }
    setStoredToken(body.token)
    setAuthProvider('google')
    Authstore.getState().setUser(authUser)
    return authUser
  },

  /** Restore user from stored token (GET /api/me). Clears token on 401. */
  async restoreSession(): Promise<AuthUser | null> {
    const token = getStoredToken()
    if (!token) return null

    // Some deployments expose current-user as /me, others as /users/me.
    const primary = await api.get<Omit<AuthUser, 'token'> | { user: Omit<AuthUser, 'token'> }>(endpoints.me())
    const fallback = !primary.ok && primary.status === 404
      ? await api.get<Omit<AuthUser, 'token'> | { user: Omit<AuthUser, 'token'> }>('/api/users/me')
      : null
    const res = fallback ?? primary

    if (!res.ok) {
      // Only hard-logout when the token is actually invalid/expired.
      if (res.status === 401) {
        setStoredToken(null)
        return null
      }
      // Keep users signed in across refresh when /me is unavailable by hydrating from token claims.
      const fromToken = await hydrateUserFromTokenClaims(token)
      if (fromToken) {
        syncAuthProviderFromToken(token)
        Authstore.getState().setUser(fromToken)
        return fromToken
      }
      setStoredToken(null)
      return null
    }

    const raw = res.data as Omit<AuthUser, 'token'> | { user: Omit<AuthUser, 'token'> }
    const profile = ('user' in raw ? raw.user : raw) as Omit<AuthUser, 'token'>
    const user: AuthUser = { ...profile, token }
    syncAuthProviderFromToken(token)
    Authstore.getState().setUser(user)
    return user
  },

  logout(): void {
    Authstore.getState().logout()
  },
}
