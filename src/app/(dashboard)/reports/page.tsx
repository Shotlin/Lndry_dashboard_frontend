"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { QueryStateView } from "@/components/QueryStateView"
import {
  getGmvReport,
  getOrderReport,
  getShopPerformanceReport,
  exportGmvReport,
  type ReportDateRange,
  type GmvRow,
  type OrderReportRow,
  type ShopPerformanceRow,
} from "@/services/reports.service"

function getErrorDetails(error: any) {
  if (!error) return { noPermission: false, message: undefined }
  
  const status = error.response?.status
  const code = error.response?.data?.code
  
  if (status === 401) {
    return { noPermission: false, message: "Unauthorized — please login again." }
  }
  if (status === 403 || code === "PERMISSION_DENIED") {
    return { noPermission: true, message: "Access Denied — you do not have permission to view reports." }
  }
  if (status === 404) {
    return { noPermission: false, message: "API endpoint not found. Please contact support." }
  }
  if (error.message === "Network Error") {
    return { noPermission: false, message: "Network error — please check your internet connection." }
  }
  
  return { noPermission: false, message: error.response?.data?.message || error.message || "An unexpected server error occurred." }
}

function formatINR(val: number | string) {
  const n = typeof val === "string" ? parseFloat(val) : val
  if (isNaN(n)) return "₹0"
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  return `₹${n.toLocaleString("en-IN")}`
}

function getDefaultRange(): ReportDateRange {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  }
}

function formatDateLabel(d?: string) {
  if (!d || typeof d !== "string") return ""
  const parts = d.split("-")
  return parts[2] ? String(parseInt(parts[2])) : d
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<ReportDateRange>(getDefaultRange)

  const { data: gmvData, isLoading: gmvLoading, isError: gmvError, error: gmvErrorObj, refetch: refetchGmv } = useQuery({
    queryKey: ["reports", "gmv", dateRange],
    queryFn: () => getGmvReport(dateRange),
    staleTime: 60 * 1000,
  })

  const { data: orderData, isLoading: orderLoading, isError: orderError, error: orderErrorObj, refetch: refetchOrders } = useQuery({
    queryKey: ["reports", "orders", dateRange],
    queryFn: () => getOrderReport(dateRange),
    staleTime: 60 * 1000,
  })

  const { data: perfData, isLoading: perfLoading, isError: perfError, error: perfErrorObj, refetch: refetchPerf } = useQuery({
    queryKey: ["reports", "shop-performance", dateRange],
    queryFn: () => getShopPerformanceReport(dateRange),
    staleTime: 60 * 1000,
  })

  const isError = gmvError || orderError || perfError
  const errorObj = gmvErrorObj || orderErrorObj || perfErrorObj
  const onRetry = () => {
    refetchGmv()
    refetchOrders()
    refetchPerf()
  }

  const { noPermission, message: errorMessage } = useMemo(() => {
    return getErrorDetails(errorObj)
  }, [errorObj])

  const exportMutation = useMutation({
    mutationFn: () => exportGmvReport(dateRange),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `report-${dateRange.from}-to-${dateRange.to}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Report exported!")
    },
    onError: () => toast.error("Failed to export report"),
  })

  // KPI computations
  const totalGmv = useMemo(() => {
    if (!gmvData || !Array.isArray(gmvData)) return 0
    return gmvData.reduce((sum: number, r: GmvRow) => sum + Number(r?.gmv || 0), 0)
  }, [gmvData])

  const completedOrders = useMemo(() => {
    if (!orderData || !Array.isArray(orderData)) return 0
    return orderData
      .filter((r: OrderReportRow) => r && r.status === "DELIVERED")
      .reduce((sum: number, r: OrderReportRow) => sum + Number(r?.count || 0), 0)
  }, [orderData])

  const cancellationRate = useMemo(() => {
    if (!orderData || !Array.isArray(orderData) || orderData.length === 0) return "0%"
    const total = orderData.reduce((s: number, r: OrderReportRow) => s + Number(r?.count || 0), 0)
    const cancelled = orderData
      .filter((r: OrderReportRow) => r && (r.status === "CANCELLED" || r.status === "PAYMENT_FAILED"))
      .reduce((s: number, r: OrderReportRow) => s + Number(r?.count || 0), 0)
    return total > 0 ? `${((cancelled / total) * 100).toFixed(1)}%` : "0%"
  }, [orderData])

  // Chart data
  const chartBars = useMemo(() => {
    if (!gmvData || !Array.isArray(gmvData) || gmvData.length === 0) return []
    const validRows = gmvData.filter((r: GmvRow) => r && r.date && typeof r.date === "string")
    if (validRows.length === 0) return []
    const maxGmv = Math.max(...validRows.map((r: GmvRow) => Number(r.gmv || 0)), 1)
    return validRows.map((r: GmvRow) => ({
      label: formatDateLabel(r.date),
      h: Math.max(4, Math.round((Number(r.gmv || 0) / maxGmv) * 100)),
      gmv: Number(r.gmv || 0),
    }))
  }, [gmvData])

  const isLoading = gmvLoading || orderLoading || perfLoading
  const dateRangeLabel = `${new Date(dateRange.from).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(dateRange.to).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`

  return (
    <QueryStateView
      isLoading={false}
      isError={isError}
      error={errorObj as any}
      noPermission={noPermission}
      noPermissionMessage={errorMessage}
      errorMessage={errorMessage}
      onRetry={onRetry}
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-[28px] font-bold tracking-tight text-[#080f14]">Reports and performance</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F1F1F5] text-[12px] font-semibold text-[#64748B]">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange((r) => ({ ...r, from: e.target.value }))}
                className="bg-transparent border-none text-[12px] text-[#64748B] focus:outline-none w-28"
              />
              <span>–</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value }))}
                className="bg-transparent border-none text-[12px] text-[#64748B] focus:outline-none w-28"
              />
            </div>
            <Button
              variant="outline"
              className="border-[#6366F1] text-[#6366F1] hover:bg-[#EEF2FF] font-bold rounded-full h-10 px-5 text-[13px]"
              disabled={exportMutation.isPending}
              onClick={() => exportMutation.mutate()}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              {exportMutation.isPending ? "Exporting..." : "Export report"}
            </Button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lndry-card">
            <span className="text-[12px] text-[#7e8998]">GMV</span>
            <div className="text-[32px] font-bold text-[#080f14] mt-1">
              {gmvLoading ? <Skeleton className="h-9 w-24" /> : formatINR(totalGmv)}
            </div>
          </div>
          <div className="lndry-card">
            <span className="text-[12px] text-[#7e8998]">Completed orders</span>
            <div className="text-[32px] font-bold text-[#080f14] mt-1">
              {orderLoading ? <Skeleton className="h-9 w-20" /> : completedOrders.toLocaleString()}
            </div>
          </div>
          <div className="lndry-card">
            <span className="text-[12px] text-[#7e8998]">Cancellation rate</span>
            <div className="text-[32px] font-bold text-[#080f14] mt-1">
              {orderLoading ? <Skeleton className="h-9 w-16" /> : cancellationRate}
            </div>
          </div>
          <div className="lndry-card">
            <span className="text-[12px] text-[#7e8998]">Vendors reporting</span>
            <div className="text-[32px] font-bold text-[#080f14] mt-1">
              {perfLoading ? <Skeleton className="h-9 w-16" /> : (perfData?.length ?? 0)}
            </div>
          </div>
        </div>

        {/* Bottom: Chart + Vendor Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* GMV by day chart */}
          <div className="lndry-card flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold text-[#080f14]">GMV by day</h2>
                <p className="text-[12px] text-[#7e8998]">Captured payments for completed and active orders</p>
              </div>
              <span className="inline-flex px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#6366F1] text-[10px] font-bold border border-[#6366F1]/10">₹ lakh</span>
            </div>
            {gmvLoading ? (
              <div className="h-[180px] flex items-end gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex-1"><Skeleton className="h-24 w-full rounded-t-md" /></div>
                ))}
              </div>
            ) : chartBars.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-[13px] text-[#7e8998]">
                No GMV data for the selected period
              </div>
            ) : (
              <div className="h-[180px] flex items-end gap-2">
                {chartBars.map((bar: { label: string; h: number; gmv: number }, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="relative w-full">
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-[#1f2937] text-white text-[10px] py-1 px-2 rounded-lg shadow-lg whitespace-nowrap z-10 font-bold">
                        {formatINR(bar.gmv)}
                      </div>
                      <div
                        style={{ height: `${bar.h}%` }}
                        className="w-full rounded-t-md bg-[#C7D2FE] hover:bg-[#6366F1] transition-colors min-h-[4px]"
                      />
                    </div>
                    <span className="text-[9px] text-[#7e8998]">{bar.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vendor performance */}
          <div className="lndry-card flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold text-[#080f14]">Vendor performance</h2>
                <p className="text-[12px] text-[#7e8998]">Based on orders in selected period</p>
              </div>
              <Link href="/vendors" className="text-[13px] text-[#6366F1] font-semibold hover:text-[#4F46E5]">View all</Link>
            </div>
            {perfLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : !perfData || perfData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[13px] text-[#7e8998]">
                No vendor performance data for the selected period
              </div>
            ) : (
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[#e8e8ef]">
                    <th className="lndry-th">Vendor</th>
                    <th className="lndry-th">Orders</th>
                    <th className="lndry-th">Revenue</th>
                    <th className="lndry-th">Avg order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f4f8]">
                  {Array.isArray(perfData) && perfData.map((v: ShopPerformanceRow) => (
                    <tr key={v?.vendor_id || Math.random().toString()} className="hover:bg-[#fafafd] transition-colors">
                      <td className="py-3 px-2 font-medium text-[#080f14]">{v?.shop_name || "Unknown"}</td>
                      <td className="py-3 px-2 text-[#334155]">{Number(v?.order_count || 0).toLocaleString()}</td>
                      <td className="py-3 px-2 text-[#334155]">{formatINR(Number(v?.revenue || 0))}</td>
                      <td className="py-3 px-2 text-[#334155]">{formatINR(Number(v?.avg_order_value || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </QueryStateView>
  )
}
