import crypto from 'crypto'
import { config } from '../config'

const API_BASE = config.phpApiBaseUrl
const INTERNAL_SHARED_SECRET = config.internalSharedSecret

export type ApiInit = RequestInit & { headers?: Record<string, string> }
// redesign internal auth : : add jwt token to the request header and remove the shared secret

export function getInternalAuthHeaders(
  method: string,
  path: string,
  userId: string,
  isAdmin: boolean
): Record<string, string> {
  if (!INTERNAL_SHARED_SECRET || !userId) {
    return {}
  }
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const adminVal = isAdmin ? '1' : '0'
  const message = `${timestamp}:${method.toUpperCase()}:${path}:${userId}:${adminVal}`
  const signature = crypto
    .createHmac('sha256', INTERNAL_SHARED_SECRET)
    .update(message)
    .digest('hex')

  return {
    'X-Internal-Admin': adminVal,
    'X-Internal-User-Id': userId,
    'X-Internal-Timestamp': timestamp,
    'X-Internal-Signature': signature,
  }
}

export async function apiFetch<T = unknown>(path: string, options: ApiInit = {}): Promise<T | null> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  })
  if (!res.ok) {
    console.error(`API error: ${res.status} ${res.statusText} for ${path}`)
  }
  try {
    return (await res.json()) as T
  } catch {
    return null
  }
}
