"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

interface UseStatusTabsOptions {
  paramName?: string
  defaultTab: string
}

export function useStatusTabs({
  paramName = "status",
  defaultTab,
}: UseStatusTabsOptions) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const initialTab = searchParams.get(paramName) ?? defaultTab
  const [activeTab, setActiveTabState] = useState(initialTab)

  // Sync state with URL parameter updates (e.g. back navigation)
  useEffect(() => {
    const currentParam = searchParams.get(paramName) ?? defaultTab
    if (currentParam !== activeTab) {
      setActiveTabState(currentParam)
    }
  }, [searchParams, paramName, defaultTab])

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab)
    const params = new URLSearchParams(searchParams.toString())
    if (tab && tab !== defaultTab) {
      params.set(paramName, tab)
    } else {
      params.delete(paramName)
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  return {
    activeTab,
    setActiveTab,
  }
}
