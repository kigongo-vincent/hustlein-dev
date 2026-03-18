import { Authstore } from '../data/Authstore'
import type { AuthUser } from '../types'

const DEV_AUTOLOGIN_KEY = 'hustle-in-dev-autologin'

function isEnabled(): boolean {
  if (!import.meta.env.DEV) return false
  const raw = localStorage.getItem(DEV_AUTOLOGIN_KEY)
  // default ON in dev
  if (raw == null) return true
  return raw === '1' || raw === 'true'
}

export function setDevAutologinEnabled(enabled: boolean) {
  localStorage.setItem(DEV_AUTOLOGIN_KEY, enabled ? 'true' : 'false')
}

export function maybeDevAutologin(): boolean {
  if (!isEnabled()) return false
  const existing = Authstore.getState().user
  if (existing) return false

  const test: AuthUser = {
    id: 'dev-freelancer-001',
    email: 'freelancer@dev.local',
    name: 'Test Freelancer',
    role: 'freelancer',
    companyId: '00000000-0000-0000-0000-000000000001',
    avatarUrl: undefined,
    token: undefined,
  }
  Authstore.getState().setUser(test)
  return true
}

