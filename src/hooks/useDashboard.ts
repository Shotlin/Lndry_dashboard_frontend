"use client"

import { useQuery } from "@tanstack/react-query"
import {
  getDashboardStats,
  getRevenueChart,
  getOrdersByHour,
  getTopProducts,
  getLowStockAlerts,
  getPendingActions,
  getLiveStats,
  getRecentOrders,
  getCategoryRevenue,
} from "@/services/dashboard.service"

export function useDashboardStats(period: "today" | "week" | "month" | "year" = "week") {
  return useQuery({
    queryKey: ["dashboard-home", "stats", period] as const,
    queryFn: () => getDashboardStats(period),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useRevenueChart(days: number = 30) {
  return useQuery({
    queryKey: ["dashboard-home", "revenue-chart", days] as const,
    queryFn: () => getRevenueChart(days),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useOrdersByHour() {
  return useQuery({
    queryKey: ["dashboard-home", "orders-by-hour"] as const,
    queryFn: getOrdersByHour,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useTopProducts(limit: number = 5) {
  return useQuery({
    queryKey: ["dashboard-home", "top-products", limit] as const,
    queryFn: () => getTopProducts(limit),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useLowStockAlerts(threshold: number = 10) {
  return useQuery({
    queryKey: ["dashboard-home", "low-stock", threshold] as const,
    queryFn: () => getLowStockAlerts(threshold),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function usePendingActions() {
  return useQuery({
    queryKey: ["dashboard-home", "pending-actions"] as const,
    queryFn: getPendingActions,
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useLiveStats() {
  return useQuery({
    queryKey: ["dashboard-home", "live-stats"] as const,
    queryFn: getLiveStats,
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000, // Auto-refresh every 15s
    placeholderData: (prev) => prev,
  })
}

export function useRecentOrders(limit: number = 10) {
  return useQuery({
    queryKey: ["dashboard-home", "recent-orders", limit] as const,
    queryFn: () => getRecentOrders(limit),
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useCategoryRevenue() {
  return useQuery({
    queryKey: ["dashboard-home", "category-revenue"] as const,
    queryFn: getCategoryRevenue,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}
