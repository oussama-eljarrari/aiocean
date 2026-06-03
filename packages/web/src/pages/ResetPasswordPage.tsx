import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { resetPassword } from "@/shared/api/password-reset"
import { AuthCardLayout } from "@/components/auth-card-layout"

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const navigate = useNavigate()

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      await resetPassword(token!, password)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCardLayout>
      {!token ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Invalid reset link</h1>
          <p className="text-balance text-muted-foreground mt-2 mb-6">
            This link is missing a reset token. Request a new one below.
          </p>
          <Button type="button" onClick={() => navigate("/forgot-password")}>
            Request reset link
          </Button>
        </div>
      ) : success ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Password reset successful</h1>
          <p className="text-balance text-muted-foreground mt-2 mb-6">
            Your password has been updated. You can now log in with your new password.
          </p>
          <Button type="button" onClick={() => navigate("/login")}>
            Log in
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold">Set new password</h1>
              <p className="text-balance text-muted-foreground">
                Enter your new password below
              </p>
            </div>
            {error && (
              <div className="text-sm font-medium text-destructive text-center">
                {error}
              </div>
            )}
            <Field>
              <FieldLabel htmlFor="password">New password</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
              <Input
                id="confirm"
                type="password"
                placeholder="Repeat your password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
            <Field>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Resetting..." : "Reset password"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      )}
    </AuthCardLayout>
  )
}
