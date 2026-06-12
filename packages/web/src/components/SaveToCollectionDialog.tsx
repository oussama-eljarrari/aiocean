import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { getCollections, createCollection, addToolToCollection, type Collection } from "@/shared/api/collections"
import { BookmarkPlus, Check, Loader2, Plus } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useNavigate } from "react-router-dom"

interface SaveToCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  toolId: string
  toolName: string
}

export function SaveToCollectionDialog({ open, onOpenChange, toolId, toolName }: SaveToCollectionDialogProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [successTooltip, setSuccessTooltip] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!open || !user) return
    setLoading(true)
    getCollections()
      .then(setCollections)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, user])

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>You need to sign in to save tools to collections.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => { onOpenChange(false); navigate("/login") }}>Sign In</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  const handleAddTo = async (collectionId: string) => {
    setSaving(collectionId)
    try {
      await addToolToCollection(collectionId, toolId)
      setSuccessTooltip(collectionId)
      setTimeout(() => setSuccessTooltip(null), 2000)
    } catch {
      // ignore
    } finally {
      setSaving(null)
    }
  }

  const handleCreateAndAdd = async () => {
    const name = newName.trim()
    if (!name) return
    setCreating(true)
    try {
      const collection = await createCollection(name, false)
      await addToolToCollection(collection.id, toolId)
      setNewName("")
      setCollections((prev) => [collection, ...prev])
      setSuccessTooltip(collection.id)
      setTimeout(() => setSuccessTooltip(null), 2000)
    } catch {
      // ignore
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Collection</DialogTitle>
          <DialogDescription>Choose a collection to save "{toolName}" to, or create a new one.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="New collection name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Button
              size="sm"
              onClick={() => void handleCreateAndAdd()}
              disabled={!newName.trim() || creating}
            >
              {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Create
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : collections.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No collections yet. Create one above.
              </p>
            ) : (
              collections.map((col) => (
                <div
                  key={col.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{col.name}</p>
                    <p className="text-xs text-muted-foreground">{col.tool_count} tools</p>
                  </div>
                  <Button
                    size="sm"
                    variant={successTooltip === col.id ? "default" : "outline"}
                    onClick={() => void handleAddTo(col.id)}
                    disabled={saving === col.id}
                  >
                    {saving === col.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : successTooltip === col.id ? (
                      <Check className="size-3.5" />
                    ) : (
                      <BookmarkPlus className="size-3.5" />
                    )}
                    {successTooltip === col.id ? " Saved" : " Save"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}