import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select"
import { Search, ChevronDown, X, Loader2, Sparkles, SlidersHorizontal, ArrowUpDown } from "lucide-react"
import TextRotate from "../components/fancy/text/text-rotate"
import { motion } from "motion/react"
import { ToolGrid } from "../components/ToolGrid"
import { useTools, type SortBy } from "../hooks/useTools"

export function LandingPage() {
    const {
        searchQuery, setSearchQuery,
        activeCategory, setActiveCategory,
        filtersExpanded, setFiltersExpanded,
        selectedPricing, setSelectedPricing,
        selectedPlatforms, setSelectedPlatforms,
        minRating, setMinRating,
        sortBy, setSortBy,
        filterPanelOpen, setFilterPanelOpen,
        loading, error,
        categories, displayedCategories,
        pricingOptions, platformOptions, ratingOptions,
        toolsToRender,
        hasActiveFilters, activeFilterCount,
        toggleSelection, clearFilters,
    } = useTools(false)

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
                            Explore 1,000+ top AI apps
                        </Badge>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
                    >
                        Supercharge your workflow <br className="hidden sm:block" />
                        with{' '}
                        <TextRotate
                            texts={[
                                "AI tools",
                                "Coding agents",
                                "Smart assistants",
                                "Creative tools",
                                "Productivity apps",
                            ]}
                            as="span"
                            mainClassName="inline-flex justify-center rounded-xl bg-primary/10 px-3 py-0.5 font-serif italic text-primary"
                            staggerFrom="last"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "-120%" }}
                            staggerDuration={0.025}
                            splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1"
                            transition={{ type: "spring", damping: 30, stiffness: 400 }}
                            rotationInterval={3500}
                        />
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
                    >
                        Find the perfect applications curated by the community to boost your productivity, creativity, and workflow.
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
                        <Select value={sortBy} onValueChange={(value) => value && setSortBy(value as SortBy)}>
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
