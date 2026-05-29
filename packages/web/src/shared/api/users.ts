import { patch } from "./client"
import type { User } from "@/hooks/use-auth"
export function updateMe(data: {
  name: string
  email: string
  pfp_url?: string | null
}) {
  return patch<{ user: User }>("/me", data)
}