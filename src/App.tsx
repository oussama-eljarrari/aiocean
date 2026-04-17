import { useState, useMemo } from "react"
import { Header } from "./components/Header"
import { ToolGrid } from "./components/ToolGrid"
import type { Tool } from "./components/ToolCard"
import { Input } from "./components/ui/input"
import { Button } from "./components/ui/button"
import { Badge } from "./components/ui/badge"
import { Search, ChevronDown, X } from "lucide-react"
import LineWaves from "./components/LineWaves"

const MOCK_TOOLS: Tool[] = [
  { id: "1", name: "WritePro", logo: "✍️", tagline: "AI powered writing assistant", category: "Writing", pricing: "Freemium", platform: "Web", usageCount: 15400, rating: 4.8, primaryUseCase: "Writing emails" },
  { id: "2", name: "GenImg", logo: "🎨", tagline: "Generate images from text", category: "Image Generation", pricing: "Paid", platform: "API", usageCount: 4200, rating: 4.5, primaryUseCase: "Blog assets" },
  { id: "3", name: "CodeBuddy", logo: "💻", tagline: "Your AI pair programmer", category: "Coding", pricing: "Free", platform: "Browser Extension", usageCount: 89000, rating: 4.9, primaryUseCase: "Refactoring" },
  { id: "4", name: "MeetingBot", logo: "🎙️", tagline: "Transcribe and summarize meetings", category: "Audio", pricing: "Freemium", platform: "Web", usageCount: 12000, rating: 4.2, primaryUseCase: "Meeting notes" },
  { id: "5", name: "DataSense", logo: "📊", tagline: "Analyze datasets with NLP", category: "Research", pricing: "Paid", platform: "Web", usageCount: 3100, rating: 4.7, primaryUseCase: "Data analysis" },
  { id: "6", name: "TaskMaster", logo: "✅", tagline: "AI agents for your daily tasks", category: "Productivity", pricing: "Free", platform: "Mobile", usageCount: 22000, rating: 4.6, primaryUseCase: "Task automation" },
  { id: "7", name: "SEO AI", logo: "🚀", tagline: "Optimize content for search engines", category: "Writing", pricing: "Freemium", platform: "Web", usageCount: 8500, rating: 4.3, primaryUseCase: "SEO optimization" },
  { id: "8", name: "SnippetGen", logo: "🧩", tagline: "Generate code snippets instantly", category: "Coding", pricing: "Free", platform: "Browser Extension", usageCount: 45000, rating: 4.8, primaryUseCase: "Boilerplate code" },
]

const CATEGORIES = ["Writing", "Image Generation", "Productivity", "Coding", "Research", "Audio"]

export function App() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  const filteredTools = useMemo(() => {
    return MOCK_TOOLS.filter((tool) => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tagline.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeCategory ? tool.category === activeCategory : true
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, activeCategory])

  const displayedCategories = filtersExpanded ? CATEGORIES : CATEGORIES.slice(0, 3)

  return (
    <div className="min-h-screen  flex flex-col font-sans text-foreground">

      <Header />

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="relative w-full px-2 py-20 md:py-20 flex flex-col items-center text-center z-10">
          <Badge variant="outline" className="mb-6 px-4 py-1.5 rounded-full border-primary/30 bg-primary/5 text-primary text-sm font-medium">
            Explore 1,000+ top AI apps
          </Badge>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl leading-tight">
            Supercharge your work<br className="hidden md:block" /> with <span className="text-primary font-serif bg-clip-text">AI tools</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl font-light leading-relaxed">
            Find the perfect applications curated by the community to boost your productivity, creativity, and workflow.
          </p>



          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground size-5" />
            <Input
              type="text"
              placeholder="Search tools, workflows, or use cases..."
              className="w-full pl-12 pr-4 h-14 text-lg rounded-2xl shadow-sm border-muted-foreground/20 focus-visible:ring-primary/40 "
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        {/* Filters and Grid */}
        <section className="w-full max-w-6xl px-4 pb-20">
          <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium mr-2 text-muted-foreground">Category</span>
              {displayedCategories.map(cat => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className="rounded-full"
                >
                  {cat}
                  {activeCategory === cat && <X className="ml-1 size-3" />}
                </Button>
              ))}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className="text-muted-foreground hover:text-foreground rounded-full"
              >
                {filtersExpanded ? "Less" : "+ More"}
                <ChevronDown className={`ml-1 size-3 transition-transform ${filtersExpanded ? "rotate-180" : ""}`} />
              </Button>
            </div>

            <div className="text-sm text-muted-foreground flex items-center gap-2">
              Found <Badge variant="secondary" className="px-1.5">{filteredTools.length}</Badge> tools
            </div>
          </div>

          <ToolGrid tools={filteredTools} />
        </section>
      </main>
    </div>
  )
}

export default App
