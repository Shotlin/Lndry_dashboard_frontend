"use client"

import { useQuery } from "@tanstack/react-query"
import { getActivityLogs } from "@/services/activity-log.service"
import { qk } from "@/lib/query-keys"
import type { ActivityLogFilters } from "@/types/activity-log.types"

export function useActivityLogs(filters: ActivityLogFilters) {
  const shopKey = "ALL"

  return useQuery({
    queryKey: qk.activityLog(shopKey, filters),
    queryFn: () => getActivityLogs(filters),
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  })
}
