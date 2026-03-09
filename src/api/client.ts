/**
 * Centralized HTTP client. All requests go through here.
 * - Reads token from localStorage (key: hustle_token); add to requests when present.
 * - On 401, clears token and dispatches 'auth:logout' so the app can redirect to login.
 */

const TOKEN_KEY = 'hustle_token'

export interface HttpResponse<T = unknown> {
  data: T
  status: number
  ok: boolean
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string | null): void {
  if (token == null) localStorage.removeItem(TOKEN_KEY)
  else localStorage.setItem(TOKEN_KEY, token)
}

function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

async function request<T>(
  method: string,
  url: string,
  body?: unknown
): Promise<HttpResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  }
  const init: RequestInit = {
    method,
    headers,
    ...(body != null && { body: JSON.stringify(body) }),
  }
  const res = await fetch(url, init)
  let data: T
  const contentType = res.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    try {
      data = await res.json()
    } catch {
      data = undefined as T
    }
  } else {
    data = undefined as T
  }

  if (res.status === 401) {
    setStoredToken(null)
    window.dispatchEvent(new CustomEvent('auth:logout'))
  }

  return {
    data,
    status: res.status,
    ok: res.ok,
  }
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
  patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body),
  delete: <T>(url: string) => request<T>('DELETE', url),
}

export function assertOk<T>(res: HttpResponse<T>): T {
  if (!res.ok) {
    const msg =
      typeof res.data === 'object' && res.data !== null && 'error' in res.data
        ? String((res.data as { error: unknown }).error)
        : `Request failed: ${res.status}`
    throw new Error(msg)
  }
  return res.data as T
}
