"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Download, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useOrders, useOrderStatusCounts, useExportOrders } from "@/hooks/useOrders"
import { useSearchFilter } from "@/hooks/useSearchFilter"
import { useStatusTabs } from "@/hooks/useStatusTabs"
import { formatRelativeTime, cn } from "@/lib/utils"
import type { Order, OrderFilters } from "@/types"

const STATUS_MAP: Record<string, string> = {
  all: "",
  waiting: "WAITING_VENDOR_CONFIRMATION",
  pickup: "PICKUP_SCHEDULED",
  processing: "PROCESSING",
  delivery: "OUT_FOR_DELIVERY",
  delivered: "DELIVERED",
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase() || ""
  if (s === "PROCESSING")
    return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857] text-[10px] font-bold">Processing</span>
  if (s === "WAITING_VENDOR_CONFIRMATION" || s === "PENDING")
    return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold">Waiting vendor</span>
  if (s === "PICKUP_SCHEDULED")
    return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#6366F1] text-[10px] font-bold">Pickup</span>
  if (s === "OUT_FOR_DELIVERY" || s === "SHIPPED")
    return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857] text-[10px] font-bold border border-[#047857]/20">Out for delivery</span>
  if (s === "DELIVERED")
    return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857] text-[10px] font-bold">Delivered</span>
  if (s === "CANCELLED" || s === "PAYMENT_FAILED" || s === "REJECTED")
    return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FEF2F2] text-[#B91C1C] text-[10px] font-bold">{s === "PAYMENT_FAILED" ? "Payment failed" : "Cancelled"}</span>
  return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#F1F1F5] text-[#64748B] text-[10px] font-bold">{status}</span>
}

function formatPayment(order: Order) {
  if (order.payment_status === "PAID" || order.payment_status === "paid") {
    const amount = order.total_amount ? `₹${order.total_amount.toLocaleString("en-IN")}` : ""
    return <span className="text-[#334155]">Paid{amount ? ` · ${amount}` : ""}</span>
  }
  if (order.payment_status === "FAILED")
    return <span className="text-[#B91C1C] font-bold">Reconcile</span>
  return <span className="text-[#B45309]">Pending</span>
}

export default function OrdersPage() {
  const router = useRouter()
  const { search, setSearch, debouncedSearch } = useSearchFilter()
  const { activeTab, setActiveTab } = useStatusTabs({ defaultTab: "all" })
  const [page, setPage] = useState(1)

  const statusFilter = STATUS_MAP[activeTab] || ""
  const { data, isLoading, isError, refetch } = useOrders({
    status: (statusFilter || undefined) as OrderFilters["status"],
    search: debouncedSearch || undefined,
    page,
    limit: 20,
  })
  const { data: statusCounts } = useOrderStatusCounts()
  const exportOrders = useExportOrders()

  const orders: Order[] = data?.orders ?? []
  const pagination = data?.pagination ?? { page: 1, totalPages: 1, total: 0 }

  const tabs = [
    { key: "all", label: "All", count: statusCounts?.all ?? pagination.total ?? 0 },
    { key: "waiting", label: "Waiting vendor", count: statusCounts?.WAITING_VENDOR_CONFIRMATION ?? statusCounts?.waiting ?? 0 },
    { key: "pickup", label: "Pickup", count: statusCounts?.PICKUP_SCHEDULED ?? statusCounts?.pickup ?? 0 },
    { key: "processing", label: "Processing", count: statusCounts?.PROCESSING ?? statusCounts?.processing ?? 0 },
    { key: "delivery", label: "Delivery", count: statusCounts?.OUT_FOR_DELIVERY ?? statusCounts?.delivery ?? 0 },
  ]

  const handleTabChange = (key: string) => {
    if (key === "exceptions") {
      router.push("/exceptions")
      return
    }
    setActiveTab(key)
    setPage(1)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-[#080f14]">Order operations</h1>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
            <Input
              placeholder="Search order, customer, vendor"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-10 h-11 rounded-full bg-white border-[#e8e8ef] text-[13px] shadow-sm"
            />
          </div>
          <Button
            variant="outline"
            className="border-[#6366F1] text-[#6366F1] hover:bg-[#EEF2FF] font-bold rounded-full h-11 px-5 text-[13px]"
            disabled={exportOrders.isPending || orders.length === 0}
            onClick={() => exportOrders.mutate({ status: statusFilter || undefined })}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            {exportOrders.isPending ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lndry-card flex flex-col justify-between min-h-[90px]">
          <span className="text-[12px] text-[#7e8998]">Waiting vendor</span>
          <strong className="text-[28px] font-bold tracking-tight text-[#080f14] mt-1">
            {statusCounts ? (statusCounts.WAITING_VENDOR_CONFIRMATION ?? statusCounts.waiting ?? 0) : <Skeleton className="h-8 w-12" />}
          </strong>
        </div>
        <div className="lndry-card flex flex-col justify-between min-h-[90px]">
          <span className="text-[12px] text-[#7e8998]">Processing</span>
          <strong className="text-[28px] font-bold tracking-tight text-[#080f14] mt-1">
            {statusCounts ? (statusCounts.PROCESSING ?? statusCounts.processing ?? 0) : <Skeleton className="h-8 w-12" />}
          </strong>
        </div>
        <div className="lndry-card flex flex-col justify-between min-h-[90px]">
          <span className="text-[12px] text-[#7e8998]">Out for delivery</span>
          <strong className="text-[28px] font-bold tracking-tight text-[#080f14] mt-1">
            {statusCounts ? (statusCounts.OUT_FOR_DELIVERY ?? statusCounts.delivery ?? 0) : <Skeleton className="h-8 w-12" />}
          </strong>
        </div>
        <div className="lndry-card flex flex-col justify-between min-h-[90px]">
          <span className="text-[12px] text-[#7e8998]">Exceptions</span>
          <strong className="text-[28px] font-bold tracking-tight text-[#080f14] mt-1">
            {statusCounts ? (statusCounts.PAYMENT_FAILED ?? statusCounts.exceptions ?? 0) : <Skeleton className="h-8 w-12" />}
          </strong>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-[#e8e8ef] pb-0 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`pb-3 text-[13px] font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.key
                ? "text-[#6366F1] border-[#6366F1]"
                : "text-[#7e8998] border-transparent hover:text-[#334155]"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 inline-flex px-1.5 py-0.5 rounded-full bg-[#F1F1F5] text-[10px] font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => router.push("/exceptions")}
          className="pb-3 text-[13px] font-semibold whitespace-nowrap transition-colors border-b-2 text-[#7e8998] border-transparent hover:text-[#334155]"
        >
          Exceptions
          {(statusCounts?.PAYMENT_FAILED ?? 0) > 0 && (
            <span className="ml-1.5 inline-flex px-1.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#B91C1C] text-[10px] font-bold">
              {statusCounts?.PAYMENT_FAILED ?? statusCounts?.exceptions ?? 0}
            </span>
          )}
        </button>
      </div>

      {/* Table */}
      <div className="lndry-card">
        {isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-[14px] text-[#B91C1C] font-semibold mb-3">Failed to load orders</p>
            <Button onClick={() => refetch()} variant="outline" className="rounded-full text-[13px] font-bold">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e8e8ef]">
                  <th className="lndry-th">Order</th>
                  <th className="lndry-th">Customer</th>
                  <th className="lndry-th">Vendor</th>
                  <th className="lndry-th">Status</th>
                  <th className="lndry-th">Payment</th>
                  <th className="lndry-th">Assignment</th>
                  <th className="lndry-th">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f4f8]">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-4 px-2"><Skeleton className="h-4 w-16" /></td>
                      <td className="py-4 px-2"><Skeleton className="h-4 w-24" /></td>
                      <td className="py-4 px-2"><Skeleton className="h-4 w-28" /></td>
                      <td className="py-4 px-2"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="py-4 px-2"><Skeleton className="h-4 w-16" /></td>
                      <td className="py-4 px-2"><Skeleton className="h-4 w-20" /></td>
                      <td className="py-4 px-2"><Skeleton className="h-4 w-14" /></td>
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <p className="text-[14px] text-[#7e8998] font-medium">No orders found</p>
                      <p className="text-[12px] text-[#94a3b8] mt-1">
                        {debouncedSearch ? "Try adjusting your search query" : "No orders match the selected filter"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr
                      key={o.id}
                      className="hover:bg-[#fafafd] transition-colors cursor-pointer"
                      onClick={() => router.push(`/orders/${o.id}`)}
                    >
                      <td className="py-4 px-2">
                        <Link href={`/orders/${o.id}`} className="font-bold text-[#080f14] hover:text-[#6366F1] transition-colors" onClick={(e) => e.stopPropagation()}>
                          #{o.order_number}
                        </Link>
                      </td>
                      <td className="py-4 px-2 text-[#334155]">{o.customer_name || "Guest"}</td>
                      <td className="py-4 px-2 text-[#334155]">{o.shop_name || o.shop?.name || "—"}</td>
                      <td className="py-4 px-2"><StatusBadge status={o.status} /></td>
                      <td className="py-4 px-2">{formatPayment(o)}</td>
                      <td className="py-4 px-2 text-[#334155]">{o.rider_name || "Not assigned"}</td>
                      <td className="py-4 px-2 text-[#7e8998]">{formatRelativeTime(o.updated_at || o.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isError && !isLoading && orders.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-[#f0f0f5] mt-2">
            <span className="text-[12px] text-[#7e8998]">
              Page {pagination.page ?? page} of {pagination.totalPages ?? 1} · {pagination.total ?? 0} orders
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full h-8 px-3 text-[12px]"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full h-8 px-3 text-[12px]"
                disabled={page >= (pagination.totalPages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
