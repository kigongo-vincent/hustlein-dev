import { create } from 'zustand'
import type { AuthUser } from '../types'

interface AuthstoreI {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  logout: () => void
}

export const Authstore = create<AuthstoreI>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))
