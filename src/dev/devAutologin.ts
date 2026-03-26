import { Authstore } from "../data/Authstore";
import type { AuthUser } from "../types";

const DEV_AUTOLOGIN_KEY = "hustle-in-dev-autologin";

function isEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  const raw = localStorage.getItem(DEV_AUTOLOGIN_KEY);
  // default ON in dev
  if (raw == null) return true;
  return raw === "1" || raw === "true";
}

export function setDevAutologinEnabled(enabled: boolean) {
  localStorage.setItem(DEV_AUTOLOGIN_KEY, enabled ? "true" : "false");
}

// Prefix used to identify dev-only tokens so the API client can skip auth:logout
// when the backend isn't running (401 from a missing real session, not an expired one).
export const DEV_TOKEN_PREFIX = "hustle-dev-local-";

export function maybeDevAutologin(): boolean {
  if (!isEnabled()) return false;
  const existing = Authstore.getState().user;
  if (existing) return false;

  const test: AuthUser = {
    id: "dev-freelancer-001",
    email: "freelancer@dev.local",
    name: "Test Freelancer",
    role: "freelancer",
    // Must match backend devids.SeedUUID("company/tekjuice") (RFC 4122 v5).
    companyId: '7de68393-8d5c-5a0c-bc7d-995b18da7842',
    avatarUrl: undefined,
    token: `${DEV_TOKEN_PREFIX}no-backend`,
  };
  Authstore.getState().setUser(test);
  return true;
}
