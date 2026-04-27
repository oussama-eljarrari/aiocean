import { useState, useEffect, useCallback } from "react"

const API_BASE = "/api"

interface UseApiOptions {
  /** Skip the initial fetch (useful for conditional loading) */
  skip?: boolean
}

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Generic hook for fetching data from the PHP API.
 *
 * @example
 * const { data, loading, error } = useApi<ToolsResponse>("/tools?category=Coding")
 */
export function useApi<T>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!options.skip)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}${endpoint}`)

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(
          body.error || `Request failed with status ${res.status}`
        )
      }

      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    if (!options.skip) {
      fetchData()
    }
  }, [fetchData, options.skip])

  return { data, loading, error, refetch: fetchData }
}
