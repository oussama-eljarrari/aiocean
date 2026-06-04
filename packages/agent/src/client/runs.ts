import { apiFetch } from './base'

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
