import { get, post } from "./client"

export async function getAdminSettings(): Promise<Record<string, string>> {
  const data = await get<{ settings: Record<string, string> }>("/admin/settings")
  return data.settings
}

export async function updateAdminSettings(settings: Record<string, string | boolean>): Promise<Record<string, string>> {
  const data = await post<{ settings: Record<string, string> }>("/admin/settings", settings)
  return data.settings
}
