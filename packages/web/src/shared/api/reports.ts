import { post } from "./client"

export interface ReportPayload {
  reason: "spam" | "inappropriate" | "duplicate" | "incorrect_info"
  note?: string
}

export async function reportTool(toolId: string, payload: ReportPayload): Promise<void> {
  await post(`/tools/${toolId}/reports`, payload)
}
