"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Download, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCustomers, useExportCustomers, useToggleBlockCustomer } from "@/hooks/useCustomers"
import { useSearchFilter } from "@/hooks/useSearchFilter"
import { useStatusTabs } from "@/hooks/useStatusTabs"
import { formatRelativeTime, cn } from "@/lib/utils"

function StatusBadge({ status }: { status: string }) {
  if (status === "Active")
    return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857] text-[10px] font-bold">{status}</span>
  if (status === "Blocked")
    return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FEF2F2] text-[#B91C1C] text-[10px] font-bold">{status}</span>
  return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold">{status}</span>
}

export default function CustomersPage() {
  const router = useRouter()
  const { search, setSearch, debouncedSearch } = useSearchFilter()
  const { activeTab, setActiveTab } = useStatusTabs({ defaultTab: "all" })
  const [page, setPage] = useState(1)

  const statusFilter = activeTab === "all" ? undefined : activeTab === "blocked" ? "blocked" : activeTab === "active" ? "active" : undefined
  const { data, isLoading, isError, refetch } = useCustomers({
    search: debouncedSearch || undefined,
    status: statusFilter as "active" | "blocked" | "" | undefined,
    page,
    limit: 20,
  })
  const exportCustomers = useExportCustomers()
  const toggleBlock = useToggleBlockCustomer()

  // Also fetch blocked count for KPI
  const { data: blockedData } = useCustomers({ status: "blocked", page: 1, limit: 1 })

  const customers = data?.customers ?? []
  const pagination = data?.pagination ?? { page: 1, totalPages: 1, total: 0 }
  const blockedCount = blockedData?.pagination?.total ?? 0
  const totalCount = pagination.total ?? 0

  // Derive KPI from available data
  const activeCount = useMemo(() => {
    if (totalCount > 0 && blockedCount >= 0) return totalCount - blockedCount
    return totalCount
  }, [totalCount, blockedCount])

  const tabs = [
    { key: "all", label: "All", count: totalCount },
    { key: "active", label: "Active", count: activeCount },
    { key: "blocked", label: "Blocked", count: blockedCount },
  ]

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setPage(1)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-[#080f14]">Customer management</h1>
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
            <Input
              placeholder="Search name, phone, customer ID"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-10 h-11 rounded-full bg-white border-[#e8e8ef] text-[13px] shadow-sm"
            />
          </div>
          <Button
            variant="outline"
            className="border-[#6366F1] text-[#6366F1] hover:bg-[#EEF2FF] font-bold rounded-full h-11 px-5 text-[13px]"
            disabled={exportCustomers.isPending || customers.length === 0}
            onClick={() => exportCustomers.mutate()}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            {exportCustomers.isPending ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lndry-card">
          <span className="text-[12px] text-[#7e8998]">Total customers</span>
          <div className="text-[32px] font-bold text-[#080f14] mt-1">
            {isLoading ? <Skeleton className="h-9 w-20" /> : totalCount.toLocaleString()}
          </div>
        </div>
        <div className="lndry-card">
          <span className="text-[12px] text-[#7e8998]">Active customers</span>
          <div className="text-[32px] font-bold text-[#080f14] mt-1">
            {isLoading ? <Skeleton className="h-9 w-20" /> : activeCount.toLocaleString()}
          </div>
        </div>
        <div className="lndry-card">
          <span className="text-[12px] text-[#7e8998]">Customers on page</span>
          <div className="text-[32px] font-bold text-[#080f14] mt-1">
            {isLoading ? <Skeleton className="h-9 w-16" /> : customers.length}
          </div>
        </div>
        <div className="lndry-card">
          <span className="text-[12px] text-[#7e8998]">Blocked</span>
          <div className="text-[32px] font-bold text-[#080f14] mt-1">
            {isLoading ? <Skeleton className="h-9 w-16" /> : blockedCount}
          </div>
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
      </div>

      {/* Table */}
      <div className="lndry-card">
        {isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-[14px] text-[#B91C1C] font-semibold mb-3">Failed to load customers</p>
            <Button onClick={() => refetch()} variant="outline" className="rounded-full text-[13px] font-bold">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e8e8ef]">
                  <th className="lndry-th">Customer</th>
                  <th className="lndry-th">Mobile</th>
                  <th className="lndry-th">Orders</th>
                  <th className="lndry-th">Last order</th>
                  <th className="lndry-th">Status</th>
                  <th className="lndry-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f4f8]">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-4 px-2"><Skeleton className="h-4 w-28" /></td>
                      <td className="py-4 px-2"><Skeleton className="h-4 w-24" /></td>
                      <td className="py-4 px-2"><Skeleton className="h-4 w-12" /></td>
                      <td className="py-4 px-2"><Skeleton className="h-4 w-16" /></td>
                      <td className="py-4 px-2"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="py-4 px-2"><Skeleton className="h-7 w-16 rounded-full" /></td>
                    </tr>
                  ))
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <p className="text-[14px] text-[#7e8998] font-medium">No customers found</p>
                      <p className="text-[12px] text-[#94a3b8] mt-1">
                        {debouncedSearch ? "Try adjusting your search query" : "No customers match the selected filter"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  customers.map((c: any) => {
                    const isBlocked = c.is_blocked || c.status === "BLOCKED"
                    return (
                      <tr key={c.id} className="hover:bg-[#fafafd] transition-colors cursor-pointer">
                        <td className="py-4 px-2">
                          <div className="font-bold text-[#080f14]">{c.name || c.full_name || "—"}</div>
                          <div className="text-[11px] text-[#7e8998] mt-0.5">{c.id?.slice(0, 12)}</div>
                        </td>
                        <td className="py-4 px-2 text-[#334155] font-mono text-[12px]">{c.phone || c.mobile || "—"}</td>
                        <td className="py-4 px-2 text-[#334155]">{c.order_count ?? c.orders_count ?? "—"}</td>
                        <td className="py-4 px-2 text-[#7e8998]">{c.last_order_at ? formatRelativeTime(c.last_order_at) : "—"}</td>
                        <td className="py-4 px-2">
                          <StatusBadge status={isBlocked ? "Blocked" : "Active"} />
                        </td>
                        <td className="py-4 px-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "rounded-full h-7 px-3 text-[11px] font-bold",
                              isBlocked ? "text-[#047857] border-[#047857]/30 hover:bg-[#ECFDF5]" : "text-[#B91C1C] border-[#B91C1C]/30 hover:bg-[#FEF2F2]"
                            )}
                            disabled={toggleBlock.isPending}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleBlock.mutate({ id: c.id, blocked: !isBlocked })
                            }}
                          >
                            {isBlocked ? "Unblock" : "Block"}
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isError && !isLoading && customers.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-[#f0f0f5] mt-2">
            <span className="text-[12px] text-[#7e8998]">
              Page {pagination.page ?? page} of {pagination.totalPages ?? 1} · {pagination.total ?? 0} customers
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm" className="rounded-full h-8 px-3 text-[12px]"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
              </Button>
              <Button
                variant="outline" size="sm" className="rounded-full h-8 px-3 text-[12px]"
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
