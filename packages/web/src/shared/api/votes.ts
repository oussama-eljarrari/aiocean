import { post } from "./client"

export interface VoteResponse {
  voted: boolean
  count: number
}

export async function toggleVote(toolId: string): Promise<VoteResponse> {
  return post<VoteResponse>(`/tools/${toolId}/vote`, {})
}
