import { create } from "zustand"
import type { AuthUser } from "../types"
import { setStoredToken } from "../api"

interface AuthstoreI {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  logout: () => void
}

export const Authstore = create<AuthstoreI>((set) => ({
  user: null,
  setUser: (user) => {
    if (user?.token) setStoredToken(user.token)
    else if (user == null) setStoredToken(null)
    set({ user })
  },
  logout: () => {
    setStoredToken(null)
    set({ user: null })
  },
}))
