import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"

export interface Tool {
  id: string
  name: string
  logo: string
  tagline: string
  category:
    | "Writing"
    | "Image Generation"
    | "Productivity"
    | "Coding"
    | "Research"
    | "Audio"
    | string
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
    return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString()
  }

  // Get badge variant for pricing
  const getPricingVariant = (pricing: string) => {
    switch (pricing) {
      case "Free":
        return "default"
      case "Freemium":
        return "secondary"
      case "Paid":
        return "outline"
      default:
        return "secondary"
    }
  }

  return (
    <Card className="flex h-full cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted text-2xl shadow-sm">
              {tool.logo}
            </div>
            <div>
              <CardTitle className="text-lg">{tool.name}</CardTitle>
              <div className="mt-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Star className="size-3.5 fill-amber-400 text-amber-500" />
                <span>{tool.rating.toFixed(1)}</span>
                <span className="mx-1">•</span>
                <span>Used by {formatUsage(tool.usageCount)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pb-5">
        <CardDescription className="mb-4 line-clamp-2 flex-1 text-sm text-foreground/80">
          {tool.tagline}
        </CardDescription>

        <div className="mt-auto">
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            Great for:{" "}
            <span className="text-foreground">{tool.primaryUseCase}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="font-normal">
              {tool.category}
            </Badge>
            <Badge
              variant={getPricingVariant(tool.pricing)}
              className="font-normal"
            >
              {tool.pricing}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
