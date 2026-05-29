import { get } from "./client"

export type AgentJobStatus = "running" | "completed" | "failed"
export type AgentTodoStatus = "pending" | "in_progress" | "completed" | "cancelled"

export interface AgentTodoItem {
  content: string
  status: AgentTodoStatus
}

export interface AgentJob {
  id: string
  submission_id: string
  status: AgentJobStatus
  messages: unknown[] | null
  todo_list: AgentTodoItem[] | null
  report: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export async function getAgentRunForSubmission(submissionId: string): Promise<AgentJob> {
  const data = await get<{ agent_job: AgentJob }>(`/admin/agent/runs/${submissionId}`)
  return data.agent_job
}
