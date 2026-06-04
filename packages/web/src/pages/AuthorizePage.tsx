import { useState, useEffect, useRef } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { get, post } from "@/shared/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import bgImage from "@/assets/wave-blue.png"
import heroImage from "@/assets/ai-ocean.png"

const OAUTH_PARAMS = [
  "response_type", "client_id", "redirect_uri",
  "code_challenge", "code_challenge_method",
  "scope", "state", "resource",
] as const

interface AuthorizeInfo {
  client: { id: string; name: string; client_uri: string | null; logo_uri: string | null }
  redirect_uri: string
  scopes: Array<{ identifier: string; description: string }>
  state: string | null
  resource: string | null
  user: { id: string; name: string; email: string } | null
  authenticated: boolean
}

function collectParams(searchParams: URLSearchParams): Record<string, string> {
  const params: Record<string, string> = {}
  for (const key of OAUTH_PARAMS) {
    const val = searchParams.get(key)
    if (val) params[key] = val
  }
  return params
}

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const { login, error } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [localErr, setLocalErr] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLocalErr(null)
    try {
      await login(email, password)
      onLogin()
    } catch (err) {
      setLocalErr(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const displayErr = localErr || error

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6 md:p-10 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>
      <div className="relative w-full max-w-sm z-10">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 min-h-[400px] md:grid-cols-2">
            <div className="flex flex-col justify-center p-6 md:p-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Sign in to continue</h1>
                  <p className="text-balance text-muted-foreground text-sm">
                    Sign in with your AI Ocean account to authorize this application.
                  </p>
                </div>
                {displayErr && (
                  <div className="text-sm font-medium text-destructive text-center">
                    {displayErr}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="auth-email" className="text-sm font-medium">Email</label>
                  <Input
                    id="auth-email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center">
                    <label htmlFor="auth-password" className="text-sm font-medium">Password</label>
                  </div>
                  <Input
                    id="auth-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </div>
            <div className="relative hidden bg-muted md:block">
              <img
                src={heroImage}
                alt="AI OCEAN"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.4]"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ConsentScreen({
  info,
  onDecision,
  submitting,
}: {
  info: AuthorizeInfo
  onDecision: (decision: "approve" | "deny") => void
  submitting: boolean
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-6 md:p-10 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>
      <div className="relative w-full max-w-lg z-10">
        <Card className="overflow-hidden">
          <CardContent className="p-6 md:p-8 flex flex-col gap-5">
            <div className="flex items-center justify-center gap-4 mb-1">
              {info.client.logo_uri ? (
                <img
                  src={info.client.logo_uri}
                  alt={info.client.name}
                  className="size-10 rounded-full object-contain ring-1 ring-foreground/10"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                />
              ) : (
                <div className="size-10 rounded-full bg-muted ring-1 ring-foreground/10 flex items-center justify-center text-sm font-medium text-muted-foreground">
                  {info.client.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-lg">⟷</span>
              </div>
              <img
                src={heroImage}
                alt="AI Ocean"
                className="size-10 rounded-full object-cover ring-1 ring-foreground/10"
              />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Authorize {info.client.name}</h1>
              <p className="text-balance text-muted-foreground text-sm mt-1">
                This application is requesting permission to act on your behalf.
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-sm flex items-center justify-between">
              <span>
                Signed in as <strong>{info.user?.name}</strong>{" "}
                <span className="text-muted-foreground">&lt;{info.user?.email}&gt;</span>
              </span>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client</span>
                <span className="font-medium text-right">{info.client.name} <span className="text-muted-foreground">({info.client.id})</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Redirect URI</span>
                <code className="text-xs text-right break-all max-w-[60%]">{info.redirect_uri}</code>
              </div>
              {info.resource && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resource</span>
                  <code className="text-xs text-right break-all max-w-[60%]">{info.resource}</code>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium mb-2">
                This will allow <strong>{info.client.name}</strong> to:
              </p>
              <div className="flex flex-col gap-1.5">
                {info.scopes.map((s) => (
                  <div key={s.identifier} className="rounded-lg border p-2.5 text-sm">
                    <div className="font-medium">{s.identifier}</div>
                    <div className="text-muted-foreground text-xs">{s.description}</div>
                  </div>
                ))}
                {info.scopes.length === 0 && (
                  <div className="text-sm text-muted-foreground">No scopes requested.</div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                disabled={submitting}
                onClick={() => onDecision("deny")}
              >
                Deny
              </Button>
              <Button
                variant="default"
                className="flex-1"
                disabled={submitting}
                onClick={() => onDecision("approve")}
              >
                {submitting ? "Processing..." : "Approve"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function AuthorizePage() {
  const [searchParams] = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [info, setInfo] = useState<AuthorizeInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [infoLoading, setInfoLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fetchedRef = useRef(false)

  const oauthParams = collectParams(searchParams)
  const hasParams = Object.keys(oauthParams).length > 0

  useEffect(() => {
    if (authLoading) return
    if (!hasParams) {
      setError("No authorization request found. Please start the OAuth flow from your MCP client.")
      return
    }
    if (!user) return
    if (fetchedRef.current) return
    fetchedRef.current = true

    setInfoLoading(true)
    setError(null)
    const query = new URLSearchParams(collectParams(searchParams)).toString()
    get<AuthorizeInfo>(`/oauth/authorize-info?${query}`)
      .then(setInfo)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to validate authorization request"))
      .finally(() => setInfoLoading(false))
  }, [authLoading, user, hasParams])

  const handleLoginSuccess = () => {
    setInfoLoading(true)
    const params = collectParams(searchParams)
    const query = new URLSearchParams(params).toString()
    get<AuthorizeInfo>(`/oauth/authorize-info?${query}`)
      .then(setInfo)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to validate authorization request"))
      .finally(() => setInfoLoading(false))
  }

  const handleDecision = async (decision: "approve" | "deny") => {
    setSubmitting(true)
    setError(null)
    try {
      const result = await post<{ redirect: string }>("/oauth/consent", {
        ...oauthParams,
        decision,
      })
      window.location.href = result.redirect
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete authorization")
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!hasParams) {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-6 md:p-10 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>
        <div className="relative w-full max-w-md z-10">
          <Card>
            <CardContent className="p-6 md:p-8 flex flex-col gap-4 text-center">
              <h1 className="text-2xl font-bold">Authorization Error</h1>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button variant="outline" onClick={() => navigate("/")}>
                Go home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm onLogin={handleLoginSuccess} />
  }

  if (infoLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading authorization details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-6 md:p-10 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>
        <div className="relative w-full max-w-md z-10">
          <Card>
            <CardContent className="p-6 md:p-8 flex flex-col gap-4 text-center">
              <h1 className="text-2xl font-bold">Authorization Error</h1>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button variant="outline" onClick={() => navigate("/")}>
                Go home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!info) return null

  return (
    <ConsentScreen
      info={info}
      onDecision={handleDecision}
      submitting={submitting}
    />
  )
}
