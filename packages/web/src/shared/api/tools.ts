import type { Tool, ToolsResponse, GetToolsParams, Category } from "../schema"
import { get } from "./client"
export type { Tool, ToolsResponse, GetToolsParams, Category } from "../schema"

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

export async function getTool(id: string): Promise<Tool> {
  return get<Tool>(`/tools/${id}`)
}

export async function getCategories(): Promise<Category[]> {
  return get<{ categories: Category[] }>("/categories").then((d) => d.categories)
}
