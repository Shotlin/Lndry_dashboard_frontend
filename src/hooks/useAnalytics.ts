"use client"

import { useQuery } from "@tanstack/react-query"
import {
  getSalesAnalytics,
  getProductPerformance,
  getCustomerCohorts,
  getDeliveryAnalytics,
  getFinancialReport,
  getComparison,
  getDeadStock,
  getGeographicAnalytics,
  getCartEnhancementAnalytics,
} from "@/services/analytics.service"
import type { GroupBy } from "@/types/analytics.types"

function useShopKey(): string {
  return "ALL"
}

export function useSalesAnalytics(
  startDate: string,
  endDate: string,
  groupBy: GroupBy = "day"
) {
  const shopKey = useShopKey()
  return useQuery({
    queryKey: ["analytics", shopKey, "sales", startDate, endDate, groupBy] as const,
    queryFn: () => getSalesAnalytics(startDate, endDate, groupBy),
    enabled: !!startDate && !!endDate,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })
}

export function useProductPerformance(
  startDate: string,
  endDate: string,
  limit = 20
) {
  const shopKey = useShopKey()
  return useQuery({
    queryKey: ["analytics", shopKey, "product-performance", startDate, endDate, limit] as const,
    queryFn: () => getProductPerformance(startDate, endDate, limit),
    enabled: !!startDate && !!endDate,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })
}

export function useCustomerCohorts() {
  const shopKey = useShopKey()
  return useQuery({
    queryKey: ["analytics", shopKey, "customer-cohorts"] as const,
    queryFn: getCustomerCohorts,
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  })
}

export function useDeliveryAnalytics(startDate: string, endDate: string) {
  const shopKey = useShopKey()
  return useQuery({
    queryKey: ["analytics", shopKey, "delivery", startDate, endDate] as const,
    queryFn: () => getDeliveryAnalytics(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })
}

export function useFinancialReport(startDate: string, endDate: string) {
  const shopKey = useShopKey()
  return useQuery({
    queryKey: ["analytics", shopKey, "financial", startDate, endDate] as const,
    queryFn: () => getFinancialReport(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })
}

export function useComparison(
  period1Start: string,
  period1End: string,
  period2Start: string,
  period2End: string
) {
  const shopKey = useShopKey()
  return useQuery({
    queryKey: [
      "analytics",
      shopKey,
      "comparison",
      period1Start,
      period1End,
      period2Start,
      period2End,
    ] as const,
    queryFn: () => getComparison(period1Start, period1End, period2Start, period2End),
    enabled:
      !!period1Start &&
      !!period1End &&
      !!period2Start &&
      !!period2End,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })
}

export function useDeadStock(limit = 30) {
  const shopKey = useShopKey()
  return useQuery({
    queryKey: ["analytics", shopKey, "dead-stock", limit] as const,
    queryFn: () => getDeadStock(limit),
    staleTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  })
}

export function useGeographicAnalytics(startDate?: string, endDate?: string) {
  const shopKey = useShopKey()
  return useQuery({
    queryKey: ["analytics", shopKey, "geographic", startDate, endDate] as const,
    queryFn: () => getGeographicAnalytics(startDate ?? "", endDate ?? ""),
    enabled: !!startDate && !!endDate,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })
}

export function useCartEnhancementAnalytics(startDate: string, endDate: string) {
  const shopKey = useShopKey()
  return useQuery({
    queryKey: ["analytics", shopKey, "cart-enhancements", startDate, endDate] as const,
    queryFn: () => getCartEnhancementAnalytics(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })
}
