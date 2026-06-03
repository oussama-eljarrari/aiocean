import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { requestPasswordReset } from "@/shared/api/password-reset"
import { AuthCardLayout } from "@/components/auth-card-layout"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCardLayout>
      {sent ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-balance text-muted-foreground mt-2 mb-6">
            If an account exists for {email}, you'll receive a password reset link shortly.
          </p>
          <Button type="button" variant="outline" onClick={() => navigate("/login")}>
            Back to login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold">Forgot password?</h1>
              <p className="text-balance text-muted-foreground">
                Enter your email and we'll send you a reset link
              </p>
            </div>
            {error && (
              <div className="text-sm font-medium text-destructive text-center">
                {error}
              </div>
            )}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Sending..." : "Send reset link"}
              </Button>
            </Field>
            <FieldDescription className="text-center">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Back to login
              </button>
            </FieldDescription>
          </FieldGroup>
        </form>
      )}
    </AuthCardLayout>
  )
}
