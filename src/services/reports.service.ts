import api from "@/lib/api"

export type ReportDateRange = { from: string; to: string }

export type GmvRow = {
  date: string
  gmv: string | number
  order_count: string | number
}

export type OrderReportRow = {
  date: string
  status: string
  count: string | number
}

export type ShopPerformanceRow = {
  vendor_id: string
  shop_name: string
  order_count: string | number
  revenue: string | number
  avg_order_value: string | number
}

type ReportResponse<T> = {
  success: boolean
  data: T[]
  meta: { page: number; limit: number; total: number }
}

async function getReport<T>(path: string, range: ReportDateRange, limit = 100) {
  const { data } = await api.get<ReportResponse<T>>(`/admin/reports/${path}`, {
    params: { ...range, limit },
  })
  return Array.isArray(data.data) ? data.data : []
}

export async function getGmvReport(range: ReportDateRange) {
  return getReport<GmvRow>("gmv", range)
}

export async function getOrderReport(range: ReportDateRange) {
  return getReport<OrderReportRow>("orders", range)
}

export async function getShopPerformanceReport(range: ReportDateRange) {
  return getReport<ShopPerformanceRow>("shop-performance", range, 10)
}

export async function exportGmvReport(range: ReportDateRange) {
  const { data } = await api.get<Blob>("/admin/reports/export", {
    params: { ...range, report: "gmv" },
    responseType: "blob",
  })
  return data
}
