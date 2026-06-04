const API_BASE = process.env.PHP_API_BASE_URL || 'http://localhost:8080'

type ApiInit = RequestInit & { headers?: Record<string, string> }

async function apiFetch<T = unknown>(path: string, options: ApiInit = {}): Promise<T | null> {
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

// --- Agent run state (called by the review agent) ---

export function createAgentRun(submissionId: string) {
  return apiFetch<{ data: { id: string } }>('/api/agent/runs', {
    method: 'POST',
    body: JSON.stringify({ submission_id: submissionId }),
  })
}

export function updateAgentStatus(runId: string, status: string) {
  return apiFetch(`/api/agent/runs/${runId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function updateAgentTodo(runId: string, todos: unknown) {
  return apiFetch(`/api/agent/runs/${runId}/todo`, {
    method: 'PATCH',
    body: JSON.stringify({ todos }),
  })
}

export function saveAgentMessages(runId: string, messages: unknown) {
  return apiFetch(`/api/agent/runs/${runId}/messages`, {
    method: 'PATCH',
    body: JSON.stringify({ messages }),
  })
}

export function saveAgentReport(runId: string, report: string) {
  return apiFetch(`/api/agent/runs/${runId}/report`, {
    method: 'PATCH',
    body: JSON.stringify({ report }),
  })
}

// --- Tools directory (exposed via MCP) ---

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

export async function listAioceanTools(params: { search?: string; category?: string }): Promise<{ tools: Tool[]; total: number; categories: string[] } | null> {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.category) qs.set('category', params.category)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const result = await apiFetch<ToolsListResponse>(`/api/tools${suffix}`)
  return result?.data ?? null
}

export async function getAioceanTool(id: string): Promise<Tool | null> {
  const result = await apiFetch<{ data: Tool }>(`/api/tools/${encodeURIComponent(id)}`)
  return result?.data ?? null
}

export async function listAioceanCategories(): Promise<string[] | null> {
  const result = await apiFetch<{ data: { categories: string[] } }>('/api/categories')
  return result?.data?.categories ?? null
}

// --- Submissions ---

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

export async function listSubmissions(status?: string): Promise<Submission[] | null> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : ''
  const result = await apiFetch<{ data: { submissions: Submission[] } }>(`/api/admin/submissions${qs}`)
  return result?.data?.submissions ?? null
}

export async function decideSubmission(id: string, status: 'approved' | 'rejected' | 'pending', adminNotes?: string): Promise<Submission | null> {
  const result = await apiFetch<{ data: { submission: Submission } }>(`/api/admin/submissions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, admin_notes: adminNotes }),
  })
  return result?.data?.submission ?? null
}
