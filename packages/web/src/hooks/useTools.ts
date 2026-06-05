import { useEffect, useMemo, useState } from "react"
import { getTools, type ToolsResponse } from "../shared/api/tools"
import type { Category } from "../shared/schema"

export type SortBy = "featured" | "most-upvoted" | "highest-rated" | "most-popular" | "name-asc"

export interface UseToolsReturn {
  searchQuery: string
  setSearchQuery: (value: string) => void
  activeCategory: string | null
  setActiveCategory: (value: string | null) => void
  filtersExpanded: boolean
  setFiltersExpanded: (value: boolean) => void
  selectedPricing: string[]
  setSelectedPricing: (value: string[] | ((prev: string[]) => string[])) => void
  selectedPlatforms: string[]
  setSelectedPlatforms: (value: string[] | ((prev: string[]) => string[])) => void
  minRating: string
  setMinRating: (value: string) => void
  sortBy: SortBy
  setSortBy: (value: SortBy) => void
  filterPanelOpen: boolean
  setFilterPanelOpen: (value: boolean) => void
  loading: boolean
  error: string | null
  tools: ToolsResponse["tools"]
  categories: Category[]
  displayedCategories: Category[]
  pricingOptions: string[]
  platformOptions: string[]
  ratingOptions: { label: string; value: string }[]
  filteredTools: ToolsResponse["tools"]
  sortedTools: ToolsResponse["tools"]
  toolsToRender: ToolsResponse["tools"]
  hasActiveFilters: boolean
  activeFilterCount: number
  toggleSelection: (value: string, current: string[], setter: (value: string[] | ((prev: string[]) => string[])) => void) => void
  clearFilters: () => void
}

export function useTools(initialPanelOpen = true): UseToolsReturn {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [selectedPricing, setSelectedPricing] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [minRating, setMinRating] = useState("any")
  const [sortBy, setSortBy] = useState<SortBy>("featured")
  const [filterPanelOpen, setFilterPanelOpen] = useState(initialPanelOpen)
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
  const allCategories: Category[] = data?.categories ?? []
  const categories = allCategories
  const displayedCategories = filtersExpanded ? allCategories : allCategories.slice(0, 3)

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

  return {
    searchQuery, setSearchQuery,
    activeCategory, setActiveCategory,
    filtersExpanded, setFiltersExpanded,
    selectedPricing, setSelectedPricing,
    selectedPlatforms, setSelectedPlatforms,
    minRating, setMinRating,
    sortBy, setSortBy,
    filterPanelOpen, setFilterPanelOpen,
    loading, error,
    tools, categories, displayedCategories,
    pricingOptions, platformOptions, ratingOptions,
    filteredTools, sortedTools, toolsToRender,
    hasActiveFilters, activeFilterCount,
    toggleSelection, clearFilters,
  }
}
