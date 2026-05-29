import { get, post, patch } from "./client"

export interface Submission {
  id: string
  tool_id: string
  tool_name: string
  tool_status: string
  tool_website: string | null
  tool_short_description: string | null
  tool_description: string | null
  tool_pricing: string | null
  tool_category: string | null
  submitted_by: string
  submitter_name: string | null
  submitter_email: string | null
  status: "pending" | "approved" | "rejected"
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface SubmitPayload {
  name: string
  short_description: string
  url?: string
  description?: string
  pricing_model?: string
  category_id?: string
}

export async function submitTool(payload: SubmitPayload): Promise<Submission> {
  const data = await post<{ submission: Submission }>("/submissions", payload)
  return data.submission
}

export async function getMySubmissions(): Promise<Submission[]> {
  const data = await get<{ submissions: Submission[] }>("/submissions/mine")
  return data.submissions
}

export async function getAdminSubmissions(status?: string): Promise<Submission[]> {
  const query = status ? `?status=${status}` : ""
  const data = await get<{ submissions: Submission[] }>(`/admin/submissions${query}`)
  return data.submissions
}

export async function decideSubmission(id: string, status: "approved" | "rejected", adminNotes?: string): Promise<Submission> {
  const data = await patch<{ submission: Submission }>(`/admin/submissions/${id}`, { status, admin_notes: adminNotes })
  return data.submission
}
