import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { get, post } from "../shared/api/client"

export interface User {
  id: string
  name: string
  email: string
  role: string
  pfp_url: string | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (email: string, pass: string) => Promise<void>
  logout: () => Promise<void>
  signup: (name: string, email: string, pass: string) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    get<{ user: User }>("/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (email: string, pass: string) => {
    setError(null)
    try {
      const result = await post<{ message: string; user: User }>("/login", { email, password: pass })
      setUser(result.user)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed"
      setError(msg)
      throw new Error(msg)
    }
  }

  const signup = async (name: string, email: string, pass: string) => {
    setError(null)
    try {
      const result = await post<{ message: string; user: User }>("/register", { name, email, password: pass })
      setUser(result.user)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Signup failed"
      setError(msg)
      throw new Error(msg)
    }
  }

  const logout = async () => {
    try {
      await post("/logout", {})
    } finally {
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const data = await get<{ user: User }>("/me")
      setUser(data.user)
    } catch {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout, signup, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
