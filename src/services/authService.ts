import { api, endpoints, assertOk, getStoredToken, setStoredToken } from '../api'
import { Authstore } from '../data/Authstore'
import type { AuthUser } from '../types'

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

export const authService = {
  async login(payload: LoginPayload): Promise<AuthUser> {
    const res = await api.post<AuthResponse>(endpoints.auth.login(), payload)
    const body = assertOk(res)
    const authUser: AuthUser = { ...body.user, token: body.token }
    setStoredToken(body.token)
    Authstore.getState().setUser(authUser)
    return authUser
  },

  async signup(payload: SignupPayload): Promise<AuthUser> {
    const res = await api.post<AuthResponse>(endpoints.auth.signup(), payload)
    const body = assertOk(res)
    const authUser: AuthUser = { ...body.user, token: body.token }
    setStoredToken(body.token)
    Authstore.getState().setUser(authUser)
    return authUser
  },

  /** Restore user from stored token (GET /api/me). Clears token on 401. */
  async restoreSession(): Promise<AuthUser | null> {
    const token = getStoredToken()
    if (!token) return null
    const res = await api.get<Omit<AuthUser, 'token'>>(endpoints.me())
    if (!res.ok) {
      setStoredToken(null)
      return null
    }
    const user: AuthUser = { ...res.data as Omit<AuthUser, 'token'>, token }
    Authstore.getState().setUser(user)
    return user
  },

  logout(): void {
    Authstore.getState().logout()
  },
}
