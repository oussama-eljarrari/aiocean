import { useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useEffect, useState } from "react"
import type { Tool } from "@/shared/schema"
import { getTool, recordClick } from "@/shared/api/tools"
import { toggleVote } from "@/shared/api/votes"
import { getReviews, type Review } from "@/shared/api/reviews"
import { ChevronUp, Star, Bookmark, Loader2, ExternalLink } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useNavigate } from "react-router-dom"
import { SaveToCollectionDialog } from "@/components/SaveToCollectionDialog"
import { ReviewDialog } from "@/components/ReviewDialog"
import { ToolLogo } from "@/components/ToolLogo"

export function ToolDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tool, setTool] = useState<Tool | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [voteCount, setVoteCount] = useState(0)
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [voting, setVoting] = useState(false)
  const [usageCount, setUsageCount] = useState(0)

  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(true)

  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const t = await getTool(id!)
        if (!cancelled) {
          setTool(t)
          setVoteCount(t.voteCount)
          setUsageCount(t.usageCount)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load tool")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      setLoadingReviews(true)
      try {
        const r = await getReviews(id!)
        if (!cancelled) setReviews(r)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingReviews(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [id])

  const handleVisitWebsite = () => {
    if (!tool?.url) return
    window.open(tool.url, "_blank", "noopener noreferrer")
    if (!user) return
    recordClick(tool.id)
      .then((result) => setUsageCount(result.count))
      .catch(() => {})
  }

  const handleUpvote = async () => {
    if (!user) {
      navigate("/login")
      return
    }
    if (!id || voting) return
    setVoting(true)
    try {
      const result = await toggleVote(id)
      setHasUpvoted(result.voted)
      setVoteCount(result.count)
    } catch {
      // ignore
    } finally {
      setVoting(false)
    }
  }

  const handleReviewSuccess = async () => {
    if (!id) return
    try {
      const [r, t] = await Promise.all([getReviews(id), getTool(id)])
      setReviews(r)
      setTool(t)
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !tool) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center">
        <h2 className="text-xl font-semibold text-destructive">Tool not found</h2>
        <p className="mt-2 text-muted-foreground">{error || "The tool you're looking for doesn't exist."}</p>
        <Button className="mt-6" onClick={() => navigate("/home")}>Browse tools</Button>
      </div>
    )
  }

  const formatCount = (num: number) => {
    return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString()
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-6">
          <ToolLogo name={tool.name} logo={tool.logo} url={tool.url} className="size-24 rounded-2xl text-5xl" imgClassName="p-2" />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{tool.name}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{tool.tagline}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{tool.category}</Badge>
              <Badge variant="outline">{tool.pricing}</Badge>
              <Badge variant="outline">{tool.platform}</Badge>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
          {tool.url && (
            <Button
              size="lg"
              className="w-full md:w-auto font-semibold"
              onClick={() => void handleVisitWebsite()}
            >
              <ExternalLink className="mr-2 size-4" />
              Visit Website
            </Button>
          )}
          <Button
            size="lg"
            variant={hasUpvoted ? "default" : "secondary"}
            className="w-full md:w-auto flex gap-2"
            onClick={() => void handleUpvote()}
            disabled={voting}
          >
            <ChevronUp className={`h-5 w-5 ${hasUpvoted ? "animate-bounce" : ""}`} />
            <span>{hasUpvoted ? "Upvoted" : "Upvote"}</span>
            <span className="opacity-70">({voteCount})</span>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full md:w-auto flex gap-2"
            onClick={() => {
              if (!user) { navigate("/login"); return }
              setSaveDialogOpen(true)
            }}
          >
            <Bookmark className="h-5 w-5" />
            Save
          </Button>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Left Column: Details & Community */}
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <p className="leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {tool.description || tool.tagline || "No description available."}
            </p>
          </section>

          <Separator />

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Reviews & Comments</h2>
              <Button variant="outline" size="sm" onClick={() => {
                if (!user) { navigate("/login"); return }
                setReviewDialogOpen(true)
              }}>
                Write a Review
              </Button>
            </div>

            {loadingReviews ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>No reviews yet. Be the first to review this tool!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                            {review.author.name
                              ? review.author.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                              : "?"}
                          </div>
                          <div>
                            <CardTitle className="text-sm font-medium">{review.author.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {new Date(review.created_at).toLocaleDateString()}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex text-amber-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating ? "fill-current" : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground/90">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Meta info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex justify-between items-center">
                 <span className="text-sm text-muted-foreground">Community rating</span>
                 <span className="font-semibold flex items-center gap-1.5">
                   {tool.rating.toFixed(1)} <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                 </span>
               </div>
               {tool.externalRating != null && (
                 <div className="flex justify-between items-center">
                   <span className="text-sm text-muted-foreground">
                     Official rating{tool.externalRatingSource ? ` · ${tool.externalRatingSource}` : ""}
                   </span>
                   <span className="font-semibold flex items-center gap-1.5">
                     {tool.externalRating.toFixed(1)} <Star className="h-4 w-4 fill-sky-400 text-sky-500" />
                   </span>
                 </div>
               )}
               <div className="flex justify-between items-center">
                 <span className="text-sm text-muted-foreground">Reviews</span>
                 <span className="font-semibold">{tool.reviewCount}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-muted-foreground">Upvotes</span>
                 <span className="font-semibold">{voteCount}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-muted-foreground">Users</span>
                  <span className="font-semibold">{formatCount(usageCount)}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-muted-foreground">Pricing</span>
                 <span className="font-semibold">{tool.pricing}</span>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <SaveToCollectionDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        toolId={tool.id}
        toolName={tool.name}
      />

      <ReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        toolId={tool.id}
        toolName={tool.name}
        onSuccess={() => void handleReviewSuccess()}
      />
    </div>
  )
}