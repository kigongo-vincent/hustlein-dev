const defaultBaseUrl = '' // use relative or env in future

export interface RequestConfig {
  baseUrl?: string
  headers?: Record<string, string>
}

export interface HttpResponse<T> {
  data: T
  status: number
  ok: boolean
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  config: RequestConfig = {}
): Promise<HttpResponse<T>> {
  const base = config.baseUrl ?? defaultBaseUrl
  const url = path.startsWith('http') ? path : `${base}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
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
  return {
    data,
    status: res.status,
    ok: res.ok,
  }
}

export const http = {
  get: <T>(path: string, config?: RequestConfig) =>
    request<T>('GET', path, undefined, config),
  post: <T>(path: string, body?: unknown, config?: RequestConfig) =>
    request<T>('POST', path, body, config),
  put: <T>(path: string, body?: unknown, config?: RequestConfig) =>
    request<T>('PUT', path, body, config),
  patch: <T>(path: string, body?: unknown, config?: RequestConfig) =>
    request<T>('PATCH', path, body, config),
  delete: <T>(path: string, config?: RequestConfig) =>
    request<T>('DELETE', path, undefined, config),
}
