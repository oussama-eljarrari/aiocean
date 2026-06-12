import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { updateMe } from "@/shared/api/users"
import { getCollections, createCollection, deleteCollection, type Collection } from "@/shared/api/collections"
import { CollectionToolsDialog } from "@/components/CollectionToolsDialog"
import { getMySubmissions, type Submission } from "@/shared/api/submissions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Loader2, Plus, Trash2, BookmarkCheck } from "lucide-react"

export function ProfilePage() {
  const { user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [pfpUrl, setPfpUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loadingCollections, setLoadingCollections] = useState(true)
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)

  const [newCollectionName, setNewCollectionName] = useState("")
  const [creatingCollection, setCreatingCollection] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [collectionToolsOpen, setCollectionToolsOpen] = useState(false)

  const loadData = () => {
    if (!user) return
    setLoadingCollections(true)
    setLoadingSubmissions(true)
    setDataError(null)

    Promise.all([
      getCollections(),
      getMySubmissions(),
    ])
      .then(([collectionsResult, submissionsResult]) => {
        setCollections(collectionsResult)
        setSubmissions(submissionsResult)
      })
      .catch((err) => {
        setDataError(err instanceof Error ? err.message : "Failed to load dashboard data")
      })
      .finally(() => {
        setLoadingCollections(false)
        setLoadingSubmissions(false)
      })
  }

  useEffect(() => {
    loadData()
  }, [user])

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

  const handleCreateCollection = async () => {
    const name = newCollectionName.trim()
    if (!name) return
    setCreatingCollection(true)
    try {
      const col = await createCollection(name, false)
      setCollections((prev) => [col, ...prev])
      setNewCollectionName("")
    } catch {
      // ignore
    } finally {
      setCreatingCollection(false)
    }
  }

  const handleDeleteCollection = async (id: string) => {
    try {
      await deleteCollection(id)
      setCollections((prev) => prev.filter((c) => c.id !== id))
    } catch {
      // ignore
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

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

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
            <Button className="w-full" variant="outline" onClick={() => void handleLogout()}>
              Logout
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
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <CardTitle>My workspace</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track your saved collections and submissions.
                </p>
              </div>
              <Button onClick={() => navigate("/submit")}>Submit a Tool</Button>
            </CardHeader>
            <CardContent>
              {dataError && (
                <p className="mb-4 text-sm font-medium text-destructive">{dataError}</p>
              )}
              <Tabs defaultValue="collections">
                <TabsList variant="line">
                  <TabsTrigger value="collections">Saved collections</TabsTrigger>
                  <TabsTrigger value="submissions">My submissions</TabsTrigger>
                </TabsList>

                <TabsContent value="collections" className="mt-4">
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="New collection name..."
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                    />
                    <Button
                      size="sm"
                      onClick={() => void handleCreateCollection()}
                      disabled={!newCollectionName.trim() || creatingCollection}
                    >
                      {creatingCollection ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Plus className="size-4" />
                      )}
                      Create
                    </Button>
                  </div>

                  {loadingCollections ? (
                    <p className="text-sm text-muted-foreground">Loading collections...</p>
                  ) : collections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No collections yet. Create one above.</p>
                  ) : (
                    <div className="grid gap-3">
                      {collections.map((collection) => (
                        <div
                          key={collection.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/10 px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="flex items-center gap-3 flex-1 cursor-pointer hover:text-primary transition-colors"
                              onClick={() => { setSelectedCollection(collection); setCollectionToolsOpen(true) }}
                            >
                              <BookmarkCheck className="size-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{collection.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {collection.tool_count} {collection.tool_count === 1 ? "tool" : "tools"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={collection.is_public ? "secondary" : "outline"}>
                              {collection.is_public ? "Public" : "Private"}
                            </Badge>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => void handleDeleteCollection(collection.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="submissions" className="mt-4">
                  {loadingSubmissions ? (
                    <p className="text-sm text-muted-foreground">Loading submissions...</p>
                  ) : submissions.length === 0 ? (
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>No submissions yet.</p>
                      <Button variant="link" size="sm" onClick={() => navigate("/submit")} className="px-0">
                        Submit your first tool
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {submissions.map((submission) => (
                        <div
                          key={submission.id}
                          className="flex flex-col gap-2 rounded-lg border bg-muted/10 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{submission.tool_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Submitted {new Date(submission.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={
                              submission.status === "pending" ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300" :
                              submission.status === "approved" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300" :
                              submission.status === "changes_requested" ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300" :
                              "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                            } variant="outline">
                              {submission.status === "changes_requested" ? "Changes Requested" : submission.status}
                            </Badge>
                          </div>
                          
                          {submission.status === "changes_requested" && (
                            <div className="w-full mt-2 border-t pt-2 text-sm text-foreground/90">
                              <p className="font-semibold text-orange-700 dark:text-orange-400">Feedback from review:</p>
                              <p className="mt-1 bg-orange-50/50 dark:bg-orange-950/20 p-2.5 rounded border border-orange-100 dark:border-orange-900/50 italic text-muted-foreground">
                                {submission.admin_notes || "Please check submission details and update."}
                              </p>
                              <div className="mt-3 flex justify-end">
                                <Button size="sm" onClick={() => navigate(`/submit?id=${submission.id}`)} className="bg-orange-600 hover:bg-orange-700 text-white gap-1">
                                  Edit & Resubmit
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <CollectionToolsDialog
        open={collectionToolsOpen}
        onOpenChange={setCollectionToolsOpen}
        collection={selectedCollection}
      />

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