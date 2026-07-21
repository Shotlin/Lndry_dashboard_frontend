"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useDebounce } from "./useDebounce"

interface UseSearchFilterOptions {
  paramName?: string
  delay?: number
}

export function useSearchFilter({
  paramName = "search",
  delay = 300,
}: UseSearchFilterOptions = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const initialSearch = searchParams.get(paramName) ?? ""
  const [search, setSearch] = useState(initialSearch)
  const debouncedSearch = useDebounce(search, delay)

  // Sync state with URL parameter updates (e.g. back navigation)
  useEffect(() => {
    const currentParam = searchParams.get(paramName) ?? ""
    if (currentParam !== search) {
      setSearch(currentParam)
    }
  }, [searchParams, paramName])

  // Sync debounced search to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (debouncedSearch) {
      params.set(paramName, debouncedSearch)
    } else {
      params.delete(paramName)
    }
    router.replace(`${pathname}?${params.toString()}`)
  }, [debouncedSearch, paramName, pathname, router])

  const clearSearch = () => {
    setSearch("")
  }

  return {
    search,
    setSearch,
    debouncedSearch,
    clearSearch,
  }
}
