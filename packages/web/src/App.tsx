import { useState, useMemo } from "react"
import { Header } from "./components/Header"
import { ToolGrid } from "./components/ToolGrid"
import type { Tool } from "./components/ToolCard"
import { Input } from "./components/ui/input"
import { Button } from "./components/ui/button"
import { Badge } from "./components/ui/badge"
import { Search, ChevronDown, X, Loader2 } from "lucide-react"
import TextRotate from "./components/fancy/text/text-rotate"
import { LayoutGroup, motion } from "motion/react"
import { useApi } from "./hooks/use-api"

interface ToolsResponse {
  tools: Tool[]
  total: number
  categories: string[]
}

export function App() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  // Build the API query string
  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("search", searchQuery)
    if (activeCategory) params.set("category", activeCategory)
    return params.toString()
  }, [searchQuery, activeCategory])

  const { data, loading, error } = useApi<ToolsResponse>(
    `/tools${queryParams ? `?${queryParams}` : ""}`
  )

  const tools = data?.tools ?? []
  const categories = data?.categories ?? []
  const displayedCategories = filtersExpanded
    ? categories
    : categories.slice(0, 3)

  return (
    <div className="flex min-h-screen flex-col font-sans text-foreground">
      <Header />

      <main className="flex flex-1 flex-col items-center">
        {/* Hero Section */}
        <section className="relative z-10 flex w-full max-w-6xl flex-col items-center px-2 py-12 text-center md:py-24">
          <LayoutGroup>
            <Badge
              variant={"outline"}
              className="border-primary text-foreground"
            >
              Explore 1,000+ top AI apps
            </Badge>

            <motion.h1
              layout
              className="mb-6 flex max-w-4xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-4xl leading-tight font-extrabold tracking-tight md:text-7xl"
            >
              <motion.span
                layout
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
              >
                Supercharge your workflow
              </motion.span>
              <motion.span layout className="whitespace-nowrap">
                with
              </motion.span>
              <TextRotate
                texts={[
                  "AI tools",
                  "Coding agents",
                  "Smart assistants",
                  "Creative tools",
                  "Productivity apps",
                ]}
                as="span"
                mainClassName="[box-shadow:inset_0_3.4px_1px_rgba(255,255,255,0.5)] border-primary inline-flex justify-center rounded-lg bg-primary px-2 py-0.5 font-serif text-white sm:px-2 sm:py-1 md:px-3 md:py-1"
                staggerFrom={"last"}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={4000}
              />
            </motion.h1>
          </LayoutGroup>

          <p className="mb-12 max-w-3xl text-xl leading-relaxed font-light text-muted-foreground md:text-2xl">
            Find the perfect applications curated by the community to boost your
            productivity, creativity, and workflow.
          </p>

          <div className="relative w-full max-w-2xl">
            <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-primary" />
            <Input
              type="text"
              placeholder="Search tools, workflows, or use cases..."
              className="h-14 w-full rounded-2xl border-muted-foreground/20 pr-4 pl-12 text-lg shadow-sm focus-visible:ring-primary/40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        {/* Filters and Grid */}
        <section className="w-full max-w-6xl px-4 pb-20">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-2 text-sm font-medium text-muted-foreground">
                Category
              </span>
              {displayedCategories.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "secondary" : "outline"}
                  size="sm"
                  onClick={() =>
                    setActiveCategory(activeCategory === cat ? null : cat)
                  }
                  className="rounded-full"
                >
                  {cat}
                  {activeCategory === cat && <X className="ml-1 size-3" />}
                </Button>
              ))}

              {categories.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  className="rounded-full text-muted-foreground hover:text-foreground"
                >
                  {filtersExpanded ? "Less" : "+ More"}
                  <ChevronDown
                    className={`ml-1 size-3 transition-transform ${filtersExpanded ? "rotate-180" : ""}`}
                  />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Found{" "}
                  <Badge variant="secondary" className="px-1.5">
                    {tools.length}
                  </Badge>{" "}
                  tools
                </>
              )}
            </div>
          </div>

          {error ? (
            <div className="py-24 text-center">
              <h3 className="text-lg font-medium text-destructive">
                Failed to load tools
              </h3>
              <p className="mt-2 text-muted-foreground">{error}</p>
            </div>
          ) : (
            <ToolGrid tools={tools} loading={loading} />
          )}
        </section>
      </main>
    </div>
  )
}

export default App
