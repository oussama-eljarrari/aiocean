import { useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import type { Tool } from "@/shared/schema"
import { ChevronUp, MessageSquare, ThumbsUp, Star, Settings, FileText } from "lucide-react"

export function ToolDetailPage() {
  const { id } = useParams()
  // Mock data for the layout structure since the backend might not have this precise endpoint populated yet.
  const [tool] = useState<Tool | null>({
    id: id || "1",
    name: "Mock AI Data Generator",
    logo: "🤖",
    tagline: "Generate realistic mock data using advanced GPT models in seconds.",
    category: "Productivity",
    pricing: "Freemium",
    platform: "Web",
    usageCount: 15400,
    rating: 4.8,
    reviewCount: 94,
    voteCount: 428,
    primaryUseCase: "Testing & Development",
  })
  
  const [upvotes, setUpvotes] = useState(428)
  const [hasUpvoted, setHasUpvoted] = useState(false)

  // In reality, we'd fetch this from via our get<Tool>(`/tools/${id}`)
  // useEffect(() => { get(`/tools/${id}`).then(setTool) }, [id])

  if (!tool) {
    return <div className="p-8 text-center">Loading...</div>
  }

  const handleUpvote = () => {
    setHasUpvoted(!hasUpvoted)
    setUpvotes((prev) => hasUpvoted ? prev - 1 : prev + 1)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-muted text-5xl border shadow-sm">
            {tool.logo}
          </div>
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
          <Button size="lg" className="w-full md:w-auto font-semibold">
            Visit Website
          </Button>
          <Button 
            size="lg" 
            variant={hasUpvoted ? "default" : "secondary"} 
            className="w-full md:w-auto flex gap-2" 
            onClick={handleUpvote}
          >
            <ChevronUp className="h-5 w-5" />
            <span>{hasUpvoted ? "Upvoted" : "Upvote"}</span>
            <span className="opacity-70">({upvotes})</span>
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
            <p className="leading-relaxed text-muted-foreground">
              {tool.name} is a state-of-the-art solution designed for {tool.primaryUseCase}. 
              It allows users to streamline their workflow by integrating powerful AI-driven capabilities directly into their day-to-day operations. Whether you're working on a small side project or a large-scale enterprise application, our API provides robust and reliable results.
            </p>
          </section>

          <Separator />

          {/* Placeholders for Community Primitives */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Reviews & Comments</h2>
              <Button variant="outline" size="sm">Write a Review</Button>
            </div>

            <div className="space-y-6">
              {/* Dummy Review 1 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">JD</div>
                      <div>
                        <CardTitle className="text-sm font-medium">Jane Doe</CardTitle>
                        <CardDescription className="text-xs">2 days ago</CardDescription>
                      </div>
                    </div>
                    <div className="flex text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/90">This tool completely changed the way I build out my staging environments. The AI generates shockingly realistic user flows.</p>
                  <div className="mt-4 flex items-center gap-4 text-xs font-medium text-muted-foreground">
                    <button className="hover:text-primary flex gap-1.5 items-center"><ThumbsUp className="h-3.5 w-3.5" /> 12 Helpful</button>
                    <button className="hover:text-primary flex gap-1.5 items-center"><MessageSquare className="h-3.5 w-3.5" /> Reply</button>
                  </div>
                </CardContent>
              </Card>

              {/* Dummy Review 2 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-500">MC</div>
                      <div>
                        <CardTitle className="text-sm font-medium">Mike Chen</CardTitle>
                        <CardDescription className="text-xs">1 week ago</CardDescription>
                      </div>
                    </div>
                    <div className="flex text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/90">Very good for the most part, but I wish the free tier allowed a few more API calls per minute.</p>
                  <div className="mt-4 flex items-center gap-4 text-xs font-medium text-muted-foreground">
                    <button className="hover:text-primary flex gap-1.5 items-center"><ThumbsUp className="h-3.5 w-3.5" /> 4 Helpful</button>
                    <button className="hover:text-primary flex gap-1.5 items-center"><MessageSquare className="h-3.5 w-3.5" /> 1 Reply</button>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                 <span className="text-sm text-muted-foreground">Overall Rating</span>
                 <span className="font-semibold flex items-center gap-1.5">{tool.rating} <Star className="h-4 w-4 fill-amber-500 text-amber-500" /></span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-muted-foreground">Total Users</span>
                 <span className="font-semibold">{tool.usageCount.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-muted-foreground">Pricing</span>
                 <span className="font-semibold">{tool.pricing}</span>
               </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Similar Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {/* Placeholders for similar tools */}
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
                   <Settings className="h-5 w-5" />
                 </div>
                 <div>
                   <p className="text-sm font-medium">DevSprint API</p>
                   <p className="text-xs text-muted-foreground">Coding</p>
                 </div>
               </div>
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
                   <FileText className="h-5 w-5" />
                 </div>
                 <div>
                   <p className="text-sm font-medium">WriteSmart</p>
                   <p className="text-xs text-muted-foreground">Writing</p>
                 </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
