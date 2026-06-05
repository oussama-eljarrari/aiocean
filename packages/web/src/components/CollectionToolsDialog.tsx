import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { getCollectionTools, type Collection } from "@/shared/api/collections"
import type { Tool } from "@/shared/schema"
import { Loader2 } from "lucide-react"

interface CollectionToolsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: Collection | null
}

export function CollectionToolsDialog({ open, onOpenChange, collection }: CollectionToolsDialogProps) {
  const navigate = useNavigate()
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !collection) return
    setLoading(true)
    setError(null)
    getCollectionTools(collection.id)
      .then(setTools)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load tools"))
      .finally(() => setLoading(false))
  }, [open, collection])

  const getPricingVariant = (pricing: string) => {
    switch (pricing) {
      case "Free":
        return "default" as const
      case "Freemium":
        return "secondary" as const
      case "Paid":
        return "outline" as const
      default:
        return "secondary" as const
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{collection?.name ?? "Collection"}</DialogTitle>
          <DialogDescription>
            {collection?.tool_count ?? 0} {collection?.tool_count === 1 ? "tool" : "tools"} in this collection
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive text-center py-4">{error}</p>
          ) : tools.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No tools in this collection.</p>
          ) : (
            tools.map((tool) => (
              <div
                key={tool.id}
                className="flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => { onOpenChange(false); navigate(`/tools/${tool.id}`) }}
              >
                <div className="flex size-9 items-center justify-center rounded-md border bg-muted text-base shrink-0">
                  {tool.logo}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{tool.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{tool.tagline}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="secondary" className="font-normal text-xs">{tool.category}</Badge>
                  <Badge variant={getPricingVariant(tool.pricing)} className="font-normal text-xs">{tool.pricing}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
