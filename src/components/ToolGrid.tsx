import type { Tool } from "./ToolCard"
import { ToolCard } from "./ToolCard"

interface ToolGridProps {
  tools: Tool[]
}

export function ToolGrid({ tools }: ToolGridProps) {
  if (tools.length === 0) {
    return (
      <div className="py-24 text-center">
        <h3 className="text-lg font-medium">No tools found</h3>
        <p className="text-muted-foreground mt-2">Try adjusting your filters or search query.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  )
}
