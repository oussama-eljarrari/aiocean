import type { Tool } from "../shared/schema"
import { ToolCard } from "./ToolCard"

interface ToolGridProps {
  tools: Tool[]
  loading?: boolean
}

export function ToolGrid({ tools, loading }: ToolGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-52 animate-pulse rounded-xl border bg-muted/40"
          />
        ))}
      </div>
    )
  }

  if (tools.length === 0) {
    return (
      <div className="py-24 text-center">
        <h3 className="text-lg font-medium">No tools found</h3>
        <p className="mt-2 text-muted-foreground">
          Try adjusting your filters or search query.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  )
}
