import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { updateMe } from "@/shared/api/users"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [open, setOpen] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [pfpUrl, setPfpUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openEdit = () => {
    setName(user?.name ?? "")
    setEmail(user?.email ?? "")
    setPfpUrl(user?.pfp_url ?? "")
    setError(null)
    setOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await updateMe({ name, email, pfp_url: pfpUrl || null })
      await refreshUser()
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  const displayName = user?.name ?? "Unknown user"
  const displayEmail = user?.email ?? "No email"
  const displayRole = user?.role ?? "member"

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid items-stretch gap-6 md:grid-cols-[320px_1fr]">
        <Card className="h-full">
          <CardHeader className="items-center text-center">
            <div className="relative">
              {user?.pfp_url ? (
                <img
                  src={user.pfp_url}
                  alt={displayName}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted text-2xl font-semibold text-muted-foreground">
                  {initials}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl">{displayName}</CardTitle>
              <p className="text-sm text-muted-foreground">{displayEmail}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {displayRole}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={openEdit}>
              Edit profile
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="text-base font-medium">{displayName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="text-base font-medium">{displayEmail}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Role</Label>
                <p className="text-base font-medium capitalize">{displayRole}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Avatar</Label>
                {user?.pfp_url ? (
                  <img
                    src={user.pfp_url}
                    alt="Avatar"
                    className="mt-2 h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No avatar set</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Keep your profile up to date so teammates can recognize you.</p>
              <p>Use a clear avatar image for faster identification.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Update your name, email, or avatar URL.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pfp_url">Avatar URL</Label>
              <Input
                id="pfp_url"
                value={pfpUrl}
                onChange={(e) => setPfpUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
              />
              {pfpUrl && (
                <img
                  src={pfpUrl}
                  alt="Preview"
                  className="mt-2 h-16 w-16 rounded-full object-cover"
                />
              )}
            </div>

            <DialogFooter showCloseButton>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
