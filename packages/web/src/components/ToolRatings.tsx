import { Star } from "lucide-react"

interface ToolRatingsProps {
  /** Community rating = average of AI Ocean user reviews. */
  rating: number
  reviewCount: number
  /** Official rating = fetched from an external source (e.g. Product Hunt). */
  externalRating?: number | null
  externalRatingCount?: number | null
  externalRatingSource?: string | null
  className?: string
}

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`)

/**
 * Shows the community rating and, when available, the official/external rating
 * side by side so the difference is visible. Community = amber, Official = blue.
 */
export function ToolRatings({
  rating,
  reviewCount,
  externalRating,
  externalRatingCount,
  externalRatingSource,
  className,
}: ToolRatingsProps) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium ${className ?? ""}`}>
      <span className="inline-flex items-center gap-1">
        <Star className="size-3.5 fill-amber-400 text-amber-500" />
        <span>{rating.toFixed(1)}</span>
        <span className="text-muted-foreground">
          Community{reviewCount ? ` · ${fmt(reviewCount)}` : ""}
        </span>
      </span>

      {externalRating != null && (
        <span className="inline-flex items-center gap-1">
          <Star className="size-3.5 fill-sky-400 text-sky-500" />
          <span>{externalRating.toFixed(1)}</span>
          <span className="text-muted-foreground">
            Official{externalRatingSource ? ` · ${externalRatingSource}` : ""}
            {externalRatingCount ? ` (${fmt(externalRatingCount)})` : ""}
          </span>
        </span>
      )}
    </div>
  )
}
