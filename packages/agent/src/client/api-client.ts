import crypto from 'crypto'
import { config } from '../config'

const API_BASE = config.phpApiBaseUrl
const INTERNAL_SHARED_SECRET = config.internalSharedSecret

export type ApiInit = RequestInit & { headers?: Record<string, string> }

export type Tool = {
  id: string
  name: string
  logo?: string
  tagline?: string
  category?: string
  pricing?: string
  platform?: string
  usageCount?: number
  rating?: number
  reviewCount?: number
  voteCount?: number
  primaryUseCase?: string
  url?: string | null
  description?: string | null
  status?: string
}

type ToolsListResponse = {
  data: {
    tools: Tool[]
    total: number
    categories: string[]
  }
}

export type Submission = {
  id: string
  tool_id: string
  tool_name: string
  tool_status: string
  tool_website?: string | null
  tool_short_description?: string | null
  tool_description?: string | null
  tool_pricing?: string | null
  tool_category?: string | null
  submitted_by: string
  submitter_name?: string | null
  submitter_email?: string | null
  status: string
  admin_notes?: string | null
  created_at: string
  updated_at: string
}

export interface SubmitToolPayload {
  name: string
  short_description: string
  url?: string | null
  description?: string | null
  pricing_model?: string | null
  category_id?: string | null
}

export interface ApiClientOptions {
  userId?: string
  isAdmin?: boolean
}

export function createApiClient(options: ApiClientOptions = {}) {
  const { userId, isAdmin } = options

  function getInternalAuthHeaders(method: string, path: string): Record<string, string> {
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

  async function apiFetch<T = unknown>(path: string, init: ApiInit = {}): Promise<T | null> {
    const method = init.method ?? 'GET'
    const authHeaders = getInternalAuthHeaders(method, path)
    const headers = {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(init.headers ?? {}),
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
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

  return {
    getIsAdmin() {
      return !!isAdmin
    },

    async listTools(params: { search?: string; category?: string }): Promise<{ tools: Tool[]; total: number; categories: string[] } | null> {
      const qs = new URLSearchParams()
      if (params.search) qs.set('search', params.search)
      if (params.category) qs.set('category', params.category)
      const suffix = qs.toString() ? `?${qs.toString()}` : ''
      const result = await apiFetch<ToolsListResponse>(`/api/tools${suffix}`)
      return result?.data ?? null
    },

    async getTool(id: string): Promise<Tool | null> {
      const result = await apiFetch<{ data: Tool }>(`/api/tools/${encodeURIComponent(id)}`)
      return result?.data ?? null
    },

    async listCategories(): Promise<string[] | null> {
      const result = await apiFetch<{ data: { categories: string[] } }>('/api/categories')
      return result?.data?.categories ?? null
    },

    async listSubmissions(status?: string): Promise<Submission[] | null> {
      const qs = status ? `?status=${encodeURIComponent(status)}` : ''
      const basePath = '/api/admin/submissions'
      const result = await apiFetch<{ data: { submissions: Submission[] } }>(`${basePath}${qs}`, {
        method: 'GET',
      })
      return result?.data?.submissions ?? null
    },

    async decideSubmission(
      id: string,
      status: 'approved' | 'rejected' | 'pending',
      adminNotes?: string
    ): Promise<Submission | null> {
      const basePath = `/api/admin/submissions/${encodeURIComponent(id)}`
      const result = await apiFetch<{ data: { submission: Submission } }>(basePath, {
        method: 'PATCH',
        body: JSON.stringify({ status, admin_notes: adminNotes }),
      })
      return result?.data?.submission ?? null
    },

    async submitTool(payload: SubmitToolPayload): Promise<Submission | null> {
      const basePath = '/api/submissions'
      const result = await apiFetch<{ data: { submission: Submission } }>(basePath, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      return result?.data?.submission ?? null
    },

    // Runs endpoints
    async createAgentRun(submissionId: string) {
      return apiFetch<{ data: { id: string } }>('/api/agent/runs', {
        method: 'POST',
        body: JSON.stringify({ submission_id: submissionId }),
      })
    },

    async updateAgentStatus(runId: string, status: string) {
      return apiFetch(`/api/agent/runs/${runId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    },

    async updateAgentTodo(runId: string, todos: unknown) {
      return apiFetch(`/api/agent/runs/${runId}/todo`, {
        method: 'PATCH',
        body: JSON.stringify({ todos }),
      })
    },

    async saveAgentMessages(runId: string, messages: unknown) {
      return apiFetch(`/api/agent/runs/${runId}/messages`, {
        method: 'PATCH',
        body: JSON.stringify({ messages }),
      })
    },

    async saveAgentReport(runId: string, report: string) {
      return apiFetch(`/api/agent/runs/${runId}/report`, {
        method: 'PATCH',
        body: JSON.stringify({ report }),
      })
    }
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
