import { useEffect, useMemo, useState } from "react"
import { ToolGrid } from "../components/ToolGrid"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import { Search, ChevronDown, X, Loader2, Sparkles, SlidersHorizontal, ArrowUpDown } from "lucide-react"
import { motion } from "motion/react"
import { getTools, type ToolsResponse } from "../shared/api/tools"

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [selectedPricing, setSelectedPricing] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [minRating, setMinRating] = useState("any")
  const [sortBy, setSortBy] = useState("featured")
  const [filterPanelOpen, setFilterPanelOpen] = useState(true)
  const [data, setData] = useState<ToolsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadTools() {
      setLoading(true)
      setError(null)
      try {
        const result = await getTools({
          search: searchQuery || undefined,
          category: activeCategory,
        })
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadTools()
    return () => { cancelled = true }
  }, [searchQuery, activeCategory])

  const tools = data?.tools ?? []
  const categories = data?.categories ?? []
  const displayedCategories = filtersExpanded ? categories : categories.slice(0, 3)

  const pricingOptions = useMemo(
    () => Array.from(new Set(tools.map((tool) => tool.pricing).filter(Boolean))).sort(),
    [tools]
  )
  const platformOptions = useMemo(
    () => Array.from(new Set(tools.map((tool) => tool.platform).filter(Boolean))).sort(),
    [tools]
  )
  const ratingOptions = [
    { label: "Any", value: "any" },
    { label: "4.5+", value: "4.5" },
    { label: "4.0+", value: "4" },
    { label: "3.0+", value: "3" },
  ]

  const filteredTools = useMemo(() => {
    let next = tools
    if (activeCategory) next = next.filter((tool) => tool.category === activeCategory)
    if (selectedPricing.length > 0) next = next.filter((tool) => selectedPricing.includes(tool.pricing))
    if (selectedPlatforms.length > 0) next = next.filter((tool) => selectedPlatforms.includes(tool.platform))
    if (minRating !== "any") {
      const min = Number(minRating)
      next = next.filter((tool) => tool.rating >= min)
    }
    return next
  }, [tools, activeCategory, selectedPricing, selectedPlatforms, minRating])

  const sortedTools = useMemo(() => {
    const next = [...filteredTools]
    switch (sortBy) {
      case "most-upvoted": return next.sort((a, b) => b.voteCount - a.voteCount)
      case "highest-rated": return next.sort((a, b) => b.rating - a.rating)
      case "most-popular": return next.sort((a, b) => b.usageCount - a.usageCount)
      case "name-asc": return next.sort((a, b) => a.name.localeCompare(b.name))
      default: return next
    }
  }, [filteredTools, sortBy])

  const toolsToRender = sortedTools
  const hasActiveFilters = Boolean(activeCategory) || selectedPricing.length > 0 || selectedPlatforms.length > 0 || minRating !== "any"

  const toggleSelection = (value: string, _current: string[], setter: (value: string[] | ((prev: string[]) => string[])) => void) => {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  const clearFilters = () => {
    setActiveCategory(null)
    setSelectedPricing([])
    setSelectedPlatforms([])
    setMinRating("any")
  }

  const activeFilterCount = (activeCategory ? 1 : 0) + (selectedPricing.length > 0 ? 1 : 0) + (selectedPlatforms.length > 0 ? 1 : 0) + (minRating !== "any" ? 1 : 0)

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden pb-16 pt-16 md:pb-24 md:pt-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(0,173,181,0.15),_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(0,173,181,0.08),_transparent_50%)]" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_bottom,_transparent_0%,_hsl(var(--background))_100%)]" />
        <div className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="mr-1.5 size-3.5" />
              Directory
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
          >
            Discover the tools that move your team faster
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            Curated AI tools for builders, creators, and operators. Filter by pricing, platform, and rating to find the right fit.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative w-full max-w-xl"
          >
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 opacity-50 blur-xl" />
            <div className="relative flex items-center">
              <Search className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tools, workflows, or use cases..."
                className="h-14 w-full rounded-2xl border-border/50 bg-card pl-12 pr-4 text-base shadow-lg shadow-primary/5 focus-visible:ring-primary/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="w-full max-w-6xl px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterPanelOpen(!filterPanelOpen)}
              className="gap-2 rounded-full border-border/50"
            >
              <SlidersHorizontal className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="mr-1 size-3.5" />
                Clear
              </Button>
            )}
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Badge variant="secondary" className="px-2 py-0.5 font-mono text-xs">
                    {toolsToRender.length}
                  </Badge>
                  <span>tools</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="size-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(value) => value && setSortBy(value)}>
              <SelectTrigger className="h-9 min-w-[160px] rounded-full border-border/50 text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="most-upvoted">Most upvoted</SelectItem>
                <SelectItem value="highest-rated">Highest rated</SelectItem>
                <SelectItem value="most-popular">Most popular</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        <motion.div
          initial={false}
          animate={{
            height: filterPanelOpen ? "auto" : 0,
            opacity: filterPanelOpen ? 1 : 0,
            marginBottom: filterPanelOpen ? 24 : 0,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="rounded-2xl border border-border/40 bg-card/50 p-5 shadow-sm backdrop-blur-sm">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</p>
                <div className="flex flex-wrap gap-2">
                  {displayedCategories.map((cat) => (
                    <Button
                      key={cat}
                      variant={activeCategory === cat ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                      className="rounded-full text-sm"
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
                      className="rounded-full text-muted-foreground"
                    >
                      {filtersExpanded ? "Less" : `+${categories.length - 3} more`}
                      <ChevronDown className={`ml-1 size-3 transition-transform ${filtersExpanded ? "rotate-180" : ""}`} />
                    </Button>
                  )}
                  {categories.length === 0 && (
                    <span className="text-xs text-muted-foreground">No categories yet</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pricing</p>
                <div className="flex flex-wrap gap-2">
                  {pricingOptions.map((option) => (
                    <Button
                      key={option}
                      variant={selectedPricing.includes(option) ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => toggleSelection(option, selectedPricing, setSelectedPricing)}
                      className="rounded-full text-sm"
                    >
                      {option}
                    </Button>
                  ))}
                  {pricingOptions.length === 0 && (
                    <span className="text-xs text-muted-foreground">No pricing data</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platform</p>
                <div className="flex flex-wrap gap-2">
                  {platformOptions.map((option) => (
                    <Button
                      key={option}
                      variant={selectedPlatforms.includes(option) ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => toggleSelection(option, selectedPlatforms, setSelectedPlatforms)}
                      className="rounded-full text-sm"
                    >
                      {option}
                    </Button>
                  ))}
                  {platformOptions.length === 0 && (
                    <span className="text-xs text-muted-foreground">No platform data</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rating</p>
                <div className="flex flex-wrap gap-2">
                  {ratingOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={minRating === option.value ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setMinRating(option.value)}
                      className="rounded-full text-sm"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {error ? (
          <div className="py-24 text-center">
            <h3 className="text-lg font-medium text-destructive">Failed to load tools</h3>
            <p className="mt-2 text-muted-foreground">{error}</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <ToolGrid tools={toolsToRender} loading={loading} />
          </motion.div>
        )}
      </section>
    </div>
  )
}
