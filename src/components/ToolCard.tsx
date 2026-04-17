import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"

export interface Tool {
  id: string
  name: string
  logo: string
  tagline: string
  category: "Writing" | "Image Generation" | "Productivity" | "Coding" | "Research" | "Audio" | string
  pricing: "Free" | "Freemium" | "Paid" | string
  platform: "Web" | "Mobile" | "API" | "Browser Extension" | string
  usageCount: number
  rating: number
  primaryUseCase: string
}

interface ToolCardProps {
  tool: Tool
}

export function ToolCard({ tool }: ToolCardProps) {
  // Format usage count (e.g. 1500 -> 1.5k)
  const formatUsage = (num: number) => {
    return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString();
  }

  // Get badge variant for pricing
  const getPricingVariant = (pricing: string) => {
    switch (pricing) {
      case "Free": return "default";
      case "Freemium": return "secondary";
      case "Paid": return "outline";
      default: return "secondary";
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-4 items-center">
            <div className="size-12 rounded-lg bg-muted flex items-center justify-center text-2xl shadow-sm border">
              {tool.logo}
            </div>
            <div>
              <CardTitle className="text-lg">{tool.name}</CardTitle>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground font-medium">
                <Star className="size-3.5 fill-amber-400 text-amber-500" />
                <span>{tool.rating.toFixed(1)}</span>
                <span className="mx-1">•</span>
                <span>Used by {formatUsage(tool.usageCount)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 pb-5">
        <CardDescription className="text-sm line-clamp-2 mb-4 text-foreground/80 flex-1">
          {tool.tagline}
        </CardDescription>
        
        <div className="mt-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Great for: <span className="text-foreground">{tool.primaryUseCase}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="font-normal">{tool.category}</Badge>
            <Badge variant={getPricingVariant(tool.pricing)} className="font-normal">{tool.pricing}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
