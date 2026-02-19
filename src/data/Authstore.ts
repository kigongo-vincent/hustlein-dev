import { create } from "zustand";
import type { AuthUser } from "../types";
import { defaultCompanyAdmin } from "../repos/mock/userRepo";

interface AuthstoreI {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

export const Authstore = create<AuthstoreI>((set) => ({
  user: defaultCompanyAdmin as AuthUser,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
