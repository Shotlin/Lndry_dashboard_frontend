"use client"

import { Suspense } from "react"
import { useSearchFilter } from "@/hooks/useSearchFilter"
import { useStatusTabs } from "@/hooks/useStatusTabs"
import { useCsvExport } from "@/hooks/useCsvExport"
import { useVendorsList } from "@/hooks/useShops"
import { DashboardSearchBar } from "@/components/dashboard/DashboardSearchBar"
import { StatCard } from "@/components/dashboard/StatCard"
import { Button } from "@/components/ui/button"
import { 
  Layers, 
  Calendar, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  Store, 
  MapPin, 
  Activity, 
  ShieldAlert,
  Inbox
} from "lucide-react"

// Status Badge styling helper
function getVendorStatusInfo(v: any) {
  const maxCapacity = v.max_capacity ?? 0
  const todayOrders = v.today_orders_count ?? 0
  const utilization = maxCapacity > 0 ? todayOrders / maxCapacity : 0

  if (v.status === "SUSPENDED") {
    return { label: "Suspended", bg: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500" }
  }
  if (!v.is_active) {
    return { label: "Inactive", bg: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" }
  }
  if (maxCapacity === 0 || utilization >= 0.9) {
    return { label: "Near capacity", bg: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" }
  }
  return { label: "Active", bg: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" }
}

// Sub-component to highlight searched query strings in vendor records
function HighlightText({ text, highlight }: { text: string; highlight: string }) {
  if (!text) return null
  if (!highlight.trim()) return <span>{text}</span>
  const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi")
  const parts = text.split(regex)
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-100 text-[#080f14] font-semibold rounded-[2px] px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

function VendorsPageInner() {
  const { search, setSearch, debouncedSearch } = useSearchFilter({ delay: 300 })
  const { activeTab, setActiveTab } = useStatusTabs({ defaultTab: "active" })
  const { exportToCsv, isExporting } = useCsvExport()

  // Query vendors matching search query
  const { data, isLoading, error, refetch, isFetching } = useVendorsList({
    limit: 1000,
    search: debouncedSearch,
  })

  const allVendors = data?.vendors ?? []

  // Custom partition logic mapping DB vendors to Vendor Management status tabs
  const getTabCategory = (v: any) => {
    const maxCapacity = v.max_capacity ?? 0
    const todayOrders = v.today_orders_count ?? 0
    const utilization = maxCapacity > 0 ? todayOrders / maxCapacity : 0

    if (v.status === "SUSPENDED") return "suspended"
    if (v.status === "APPROVED" && !v.is_active) return "inactive"
    if (v.status === "APPROVED" && v.is_active && (maxCapacity === 0 || utilization >= 0.9)) return "capacity"
    if (v.status === "APPROVED" && v.is_active) return "active"
    return "unknown"
  }

  // Calculate tab badge counts dynamically
  const counts = {
    active: allVendors.filter((v) => getTabCategory(v) === "active").length,
    suspended: allVendors.filter((v) => getTabCategory(v) === "suspended").length,
    inactive: allVendors.filter((v) => getTabCategory(v) === "inactive").length,
    capacity: allVendors.filter((v) => getTabCategory(v) === "capacity").length,
  }

  // Filter vendors based on active status tab
  const filteredVendors = allVendors.filter((v) => getTabCategory(v) === activeTab)

  // Compute live KPIs
  const totalPublishedServices = allVendors.reduce((sum, v) => sum + (v.services_count ?? 0), 0)
  
  const totalAvailablePickupSlots = allVendors.reduce((sum, v) => {
    if (v.status === "APPROVED" && v.is_active) {
      return sum + Math.max(0, (v.max_capacity ?? 0) - (v.today_orders_count ?? 0))
    }
    return sum
  }, 0)

  const vendorsBelowAcceptance = allVendors.filter(
    (v) => v.status === "APPROVED" && (v.acceptance_rate ?? 100) < 80
  ).length

  // CSV Export implementation
  const handleExport = () => {
    if (filteredVendors.length === 0) return

    const headers = [
      "Vendor ID",
      "Vendor Name",
      "Owner Name",
      "Location",
      "Radius",
      "Active Services",
      "Capacity Today",
      "Acceptance Rate",
      "Status",
    ]

    const rows = filteredVendors.map((v) => {
      const location = v.address_line1 || v.city || "N/A"
      const capacity = `${v.today_orders_count ?? 0} / ${v.max_capacity ?? 0}`
      const { label } = getVendorStatusInfo(v)

      return [
        v.id,
        v.name,
        v.owner_name || "N/A",
        location,
        `${v.delivery_radius_km} km`,
        v.services_count ?? 0,
        capacity,
        `${v.acceptance_rate ?? 100}%`,
        label,
      ]
    })

    exportToCsv(
      `vendors_export_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows
    )
  }

  const tabs = [
    { key: "active", label: "Active", count: counts.active },
    { key: "suspended", label: "Suspended", count: counts.suspended },
    { key: "inactive", label: "Inactive", count: counts.inactive },
    { key: "capacity", label: "Capacity review", count: counts.capacity },
  ]

  return (
    <div className="space-y-6">
      {/* Top Header & Search Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Vendor management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor vendor operations, capacities, and active service catalogs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DashboardSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search vendor, owner, location..."
            className="w-full sm:w-64"
          />
          <Button
            onClick={handleExport}
            disabled={filteredVendors.length === 0 || isExporting || isLoading}
            variant="outline"
            className="border-brand-500 text-brand-600 hover:bg-brand-50 font-semibold rounded-lg h-10 px-4 text-xs flex items-center gap-1.5 transition-all duration-200 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          label="Published services"
          value={isLoading ? "..." : String(totalPublishedServices)}
          subLabel="Across active vendors"
          icon={<Layers className="h-5 w-5 text-brand-600" />}
        />
        <StatCard
          label="Available pickup slots"
          value={isLoading ? "..." : String(totalAvailablePickupSlots)}
          subLabel="Today across platform"
          icon={<Calendar className="h-5 w-5 text-brand-600" />}
        />
        <StatCard
          label="Vendors below 80% acceptance"
          value={isLoading ? "..." : String(vendorsBelowAcceptance)}
          subLabel="Operational review recommended"
          icon={<AlertTriangle className="h-5 w-5 text-brand-600" />}
        />
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-6 border-b border-slate-200 pb-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-semibold transition-all duration-200 border-b-2 relative ${
                isActive
                  ? "text-brand-600 border-brand-500"
                  : "text-slate-500 border-transparent hover:text-slate-800"
              }`}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-all duration-200 ${
                    isActive ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isLoading ? "..." : tab.count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Error Boundary / Failure State */}
      {error && (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-red-100 rounded-xl shadow-sm space-y-4">
          <ShieldAlert className="h-12 w-12 text-red-500 animate-bounce" />
          <div className="text-center">
            <h3 className="text-sm font-bold text-slate-800">Connection Failed</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Unable to load vendor information. Please check your local server or retry.
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg h-9 px-4 text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry connection
          </Button>
        </div>
      )}

      {/* Vendors Table Card */}
      {!error && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Radius</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Active Services</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Capacity Today</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acceptance</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Skeleton Loader State */}
                {isLoading &&
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-4">
                        <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-slate-100 rounded w-20"></div>
                      </td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-12"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-8 text-center"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-12"></div></td>
                      <td className="py-4 px-4"><div className="h-6 bg-slate-100 rounded-full w-20"></div></td>
                    </tr>
                  ))}

                {/* Empty State */}
                {!isLoading && filteredVendors.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 px-4 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Inbox className="h-10 w-10 text-slate-300" />
                        <h3 className="text-sm font-semibold text-slate-700">No matching vendors found</h3>
                        <p className="text-xs text-slate-400 max-w-xs">
                          Try searching for another term, checking active status tabs, or creating a new vendor application.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Data Row Render */}
                {!isLoading &&
                  filteredVendors.map((v) => {
                    const statusInfo = getVendorStatusInfo(v)
                    const location = v.address_line1 || v.city || "N/A"
                    const maxCapacity = v.max_capacity ?? 0
                    const todayOrders = v.today_orders_count ?? 0
                    return (
                      <tr
                        key={v.id}
                        className="hover:bg-slate-50/70 active:bg-slate-100/50 transition-all duration-150 cursor-pointer text-sm"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 font-bold uppercase shrink-0">
                              <Store className="h-4 w-4 text-slate-500" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">
                                <HighlightText text={v.name} highlight={debouncedSearch} />
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 font-medium flex items-center gap-1.5">
                                <span className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">
                                  <HighlightText text={v.id} highlight={debouncedSearch} />
                                </span>
                                <span>•</span>
                                <span>
                                  Owner: <HighlightText text={v.owner_name} highlight={debouncedSearch} />
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <HighlightText text={location} highlight={debouncedSearch} />
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-medium">
                          {v.delivery_radius_km} km
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-semibold">
                          {v.services_count ?? 0}
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-medium">
                          <div className="flex items-center gap-2">
                            <span>{todayOrders} / {maxCapacity}</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  maxCapacity === 0 ? "bg-slate-300" :
                                  (todayOrders / maxCapacity) >= 0.9 ? "bg-amber-500" :
                                  "bg-emerald-500"
                                }`}
                                style={{
                                  width: `${Math.min(100, maxCapacity > 0 ? (todayOrders / maxCapacity) * 100 : 0)}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-medium">
                          <div className="flex items-center gap-1">
                            <Activity className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className={(v.acceptance_rate ?? 100) < 80 ? "text-red-600 font-bold" : ""}>
                              {v.acceptance_rate ?? 100}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 ${statusInfo.bg}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`}></span>
                            {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          {/* Table Footer Stats indicator */}
          {!isLoading && filteredVendors.length > 0 && (
            <div className="py-3 px-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing <span className="font-semibold text-slate-700">{filteredVendors.length}</span> of{" "}
                <span className="font-semibold text-slate-700">{allVendors.length}</span> matching vendors
              </div>
              {isFetching && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Refreshing...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function VendorsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-24">
        <RefreshCw className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    }>
      <VendorsPageInner />
    </Suspense>
  )
}
