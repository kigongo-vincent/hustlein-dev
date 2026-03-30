import { create } from "zustand"
import type { AuthUser } from "../types"
import { setStoredToken } from "../api"
import { clearAuthProvider } from "../utils/authProviderStorage"

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
    clearAuthProvider()
    setStoredToken(null)
    // Prevent dev-only autologin from immediately re-authing after a user-initiated logout.
    // (Protected route checks this key to decide whether to call `maybeDevAutologin()`.)
    try {
      localStorage.setItem('hustle-in-dev-autologin', 'false')
    } catch {
      // ignore (e.g. privacy mode / SSR)
    }
    set({ user: null })
  },
}))
