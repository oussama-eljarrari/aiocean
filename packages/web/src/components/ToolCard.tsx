import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronUp } from "lucide-react"
import { Link } from "react-router-dom"
import type { Tool } from "../shared/schema"
import { ToolLogo } from "./ToolLogo"
import { ToolRatings } from "./ToolRatings"

interface ToolCardProps {
  tool: Tool
}

export function ToolCard({ tool }: ToolCardProps) {
  const formatUsage = (num: number) => {
    return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString()
  }

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
    <Link to={`/tools/${tool.id}`} className="block h-full transition-transform hover:-translate-y-1">
      <Card className="flex h-full cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
            <ToolLogo name={tool.name} logo={tool.logo} url={tool.url} className="size-12 rounded-lg text-2xl" />
            <div>
              <CardTitle className="text-lg">{tool.name}</CardTitle>
              <div className="mt-1 space-y-1">
                <ToolRatings
                  rating={tool.rating}
                  reviewCount={tool.reviewCount}
                  externalRating={tool.externalRating}
                  externalRatingCount={tool.externalRatingCount}
                  externalRatingSource={tool.externalRatingSource}
                />
                <div className="text-xs font-medium text-muted-foreground">
                  Used by {formatUsage(tool.usageCount)}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ChevronUp className="size-3.5" />
            <span>{tool.voteCount}</span>
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
    </Link>)
}