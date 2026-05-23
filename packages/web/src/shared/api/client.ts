const API_BASE = "/api"

interface ApiEnvelope<T> {
  data?: T
  meta?: unknown
}

function buildUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const init: RequestInit = {
    method,
    credentials: "include",
  }
  if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" }
    init.body = JSON.stringify(body)
  }
  const res = await fetch(buildUrl(path), init)
  if (!res.ok) {
    const text = await res.text()
    let message: string
    try {
      const parsed = JSON.parse(text)
      message = parsed?.error ?? `Request failed with status ${res.status}`
    } catch {
      message = text || `Request failed with status ${res.status}`
    }
    throw new Error(message)
  }
  const data = (await res.json()) as ApiEnvelope<T> | T
  if (data && typeof data === "object" && "data" in data) {
    return (data as ApiEnvelope<T>).data as T
  }
  return data as T
}

export async function get<T>(path: string): Promise<T> {
  return request<T>("GET", path)
}

export async function post<T>(path: string, data: unknown): Promise<T> {
  return request<T>("POST", path, data)
}

export async function patch<T>(path: string, data: unknown): Promise<T> {
  return request<T>("PATCH", path, data)
}

export async function del<T = void>(path: string, body?: unknown): Promise<T> {
  return request<T>("DELETE", path, body)
}
