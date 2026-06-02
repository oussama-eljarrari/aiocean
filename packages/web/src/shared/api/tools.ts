import type { ToolsResponse, GetToolsParams } from "../schema"
import { get } from "./client"
export type { Tool, ToolsResponse, GetToolsParams } from "../schema"

export async function getTools(params: GetToolsParams = {}): Promise<ToolsResponse> {
  const query = new URLSearchParams()

  if (params.search) {
    query.set("search", params.search)
  }

  if (params.category) {
    query.set("category", params.category)
  }

  const qs = query.toString()
  return get<ToolsResponse>(`/tools${qs ? `?${qs}` : ""}`)
}
