import { post } from "./client"

export const requestPasswordReset = (email: string) =>
  post<{ message: string }>("/forgot-password", { email })

export const resetPassword = (token: string, password: string) =>
  post<{ message: string }>("/reset-password", { token, password })
