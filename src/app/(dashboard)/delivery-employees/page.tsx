"use client"

import { useState } from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRiders, useToggleSuspend } from "@/hooks/useRiders"
import { useDashboardStats } from "@/hooks/useDashboard"
import { useDebounce } from "@/hooks/useDebounce"
import { RiderDetailDrawer } from "@/components/riders/RiderDetailDrawer"
import type { Rider } from "@/types/rider.types"

function StatusBadge({ rider }: { rider: Rider }) {
  if (!rider.is_active) {
    return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FEF2F2] text-[#B91C1C] text-[10px] font-bold">Suspended</span>
  }
  if (!rider.is_approved) {
    return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FFFBEB] text-[#B45309] text-[10px] font-bold">Pending approval</span>
  }
  if (rider.is_online) {
    return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857] text-[10px] font-bold">Online</span>
  }
  return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#475569] text-[10px] font-bold">Offline</span>
}

export default function DeliveryEmployeesPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null)
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, isError } = useRiders({
    search: debouncedSearch || undefined,
    page,
    limit: 20,
  })
  const { data: stats } = useDashboardStats("month")
  const { data: pendingData } = useRiders({ status: "pending", limit: 1 })
  const { data: suspendedData } = useRiders({ status: "suspended", limit: 1 })
  const toggleSuspend = useToggleSuspend()

  const riders = data?.riders ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / 20))

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-[#080f14]">Delivery employees</h1>
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
            <Input
              placeholder="Search name or phone"
              className="pl-10 h-11 rounded-full bg-white border-[#e8e8ef] text-[13px] shadow-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lndry-card">
          <span className="text-[12px] text-[#7e8998]">Total riders</span>
          <div className="text-[32px] font-bold text-[#080f14] mt-1">{stats?.riders.value ?? "—"}</div>
        </div>
        <div className="lndry-card">
          <span className="text-[12px] text-[#7e8998]">Online now</span>
          <div className="text-[32px] font-bold text-[#080f14] mt-1">{stats?.riders.active ?? "—"}</div>
        </div>
        <div className="lndry-card">
          <span className="text-[12px] text-[#7e8998]">Pending approval</span>
          <div className="text-[32px] font-bold text-[#080f14] mt-1">{pendingData?.total ?? "—"}</div>
        </div>
        <div className="lndry-card">
          <span className="text-[12px] text-[#7e8998]">Suspended</span>
          <div className="text-[32px] font-bold text-[#080f14] mt-1">{suspendedData?.total ?? "—"}</div>
        </div>
      </div>

      {/* Table */}
      <div className="lndry-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#e8e8ef]">
                <th className="lndry-th">Name</th>
                <th className="lndry-th">Vehicle</th>
                <th className="lndry-th">Phone</th>
                <th className="lndry-th">Total deliveries</th>
                <th className="lndry-th">Rating</th>
                <th className="lndry-th">Status</th>
                <th className="lndry-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f4f8]">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#7e8998]">
                    <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                    Loading riders…
                  </td>
                </tr>
              )}
              {isError && !isLoading && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#B91C1C]">
                    Failed to load riders.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && riders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#7e8998]">
                    No riders found.
                  </td>
                </tr>
              )}
              {riders.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-[#fafafd] transition-colors cursor-pointer"
                  onClick={() => setSelectedRiderId(r.id)}
                >
                  <td className="py-4 px-2">
                    <div className="font-bold text-[#080f14]">{r.name}</div>
                  </td>
                  <td className="py-4 px-2 text-[#334155]">
                    {r.vehicle_type ? `${r.vehicle_type}${r.vehicle_number ? ` (${r.vehicle_number})` : ""}` : "—"}
                  </td>
                  <td className="py-4 px-2 text-[#334155] font-mono text-[12px]">{r.phone}</td>
                  <td className="py-4 px-2 text-[#334155]">{r.total_deliveries}</td>
                  <td className="py-4 px-2 text-[#334155]">{r.rating ? r.rating.toFixed(1) : "—"}</td>
                  <td className="py-4 px-2"><StatusBadge rider={r} /></td>
                  <td className="py-4 px-2 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[12px]"
                      disabled={toggleSuspend.isPending}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSuspend.mutate({ id: r.id, suspended: r.is_active })
                      }}
                    >
                      {r.is_active ? "Suspend" : "Unsuspend"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 py-4">
            <span className="text-[12px] text-[#7e8998]">
              Page {page} of {totalPages} · {total} riders
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <RiderDetailDrawer
        riderId={selectedRiderId}
        open={selectedRiderId !== null}
        onClose={() => setSelectedRiderId(null)}
      />
    </div>
  )
}
