import { apiFetch, getInternalAuthHeaders } from './base'

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

export async function listSubmissions(status?: string, userId?: string, isAdmin?: boolean): Promise<Submission[] | null> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : ''
  const basePath = '/api/admin/submissions'
  const headers = userId ? getInternalAuthHeaders('GET', basePath, userId, !!isAdmin) : {}
  const result = await apiFetch<{ data: { submissions: Submission[] } }>(`${basePath}${qs}`, {
    method: 'GET',
    headers,
  })
  return result?.data?.submissions ?? null
}

export async function decideSubmission(
  id: string,
  status: 'approved' | 'rejected' | 'pending',
  adminNotes?: string,
  userId?: string,
  isAdmin?: boolean
): Promise<Submission | null> {
  const basePath = `/api/admin/submissions/${encodeURIComponent(id)}`
  const headers = userId ? getInternalAuthHeaders('PATCH', basePath, userId, !!isAdmin) : {}
  const result = await apiFetch<{ data: { submission: Submission } }>(basePath, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status, admin_notes: adminNotes }),
  })
  return result?.data?.submission ?? null
}
