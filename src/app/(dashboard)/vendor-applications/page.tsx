"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { AlertCircle, RefreshCw, Download, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"
import { getVendorsList } from "@/services/vendors.service"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { getApplicationWorkflowState } from "@/lib/application-workflow"
import { cn } from "@/lib/utils"
import { useSearchFilter } from "@/hooks/useSearchFilter"
import { useStatusTabs } from "@/hooks/useStatusTabs"
import { useCsvExport } from "@/hooks/useCsvExport"
import { DashboardSearchBar } from "@/components/dashboard/DashboardSearchBar"

const TABS = [
  { key: "new", label: "New" },
  { key: "in_review", label: "In review" },
  { key: "correction", label: "Correction" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
]

function HighlightText({ text, highlight }: { text: string; highlight: string }) {
  if (!text) return null
  if (!highlight.trim()) {
    return <span>{text}</span>
  }
  const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, "gi")
  const parts = text.split(regex)
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-100 text-yellow-900 px-0.5 rounded font-medium">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  )
}

function DocBadge({ status }: { status: string }) {
  if (status === "CORRECTION_REQUIRED") return <span className="inline-flex px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold">Correction</span>
  if (status === "APPROVED") return <span className="inline-flex px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] text-[10px] font-bold">Approved</span>
  if (status === "REJECTED") return <span className="inline-flex px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#B91C1C] text-[10px] font-bold">Rejected</span>
  return <span className="inline-flex px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#6366F1] text-[10px] font-bold">Pending Review</span>
}

function StatusBadge({ app }: { app: { status: string; created_at: string } }) {
  const state = getApplicationWorkflowState(app)
  if (state === "new") {
    return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#6366F1] text-[10px] font-bold border border-[#6366F1]/10">New</span>
  }
  if (state === "in_review") {
    return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold border border-[#B45309]/10">In review</span>
  }
  if (state === "correction") {
    return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold">Correction</span>
  }
  if (state === "approved") {
    return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857] text-[10px] font-bold">Approved</span>
  }
  if (state === "rejected") {
    return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FEF2F2] text-[#B91C1C] text-[10px] font-bold">Rejected</span>
  }
  return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#475569] text-[10px] font-bold">{app.status}</span>
}

export default function VendorApplicationsPage() {
  const { search, setSearch, debouncedSearch } = useSearchFilter({ delay: 300 })
  const { activeTab, setActiveTab } = useStatusTabs({ defaultTab: "new" })
  const { exportToCsv, isExporting } = useCsvExport()

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["vendor-applications-list"],
    queryFn: () => getVendorsList({ limit: 1000 }),
    staleTime: 30 * 1000,
  })

  const applications = data?.vendors || []

  // Dynamic tab counts calculation
  const tabCounts = useMemo(() => {
    const counts = { new: 0, in_review: 0, correction: 0, approved: 0, rejected: 0 }
    for (const app of applications) {
      const state = getApplicationWorkflowState(app)
      if (state !== "unknown") {
        counts[state as keyof typeof counts]++
      }
    }
    return counts
  }, [applications])

  // Filter applications by active tab + debounced search query
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const state = getApplicationWorkflowState(app)
      if (state !== activeTab) return false

      if (!debouncedSearch) return true
      const query = debouncedSearch.toLowerCase()
      const businessName = (app.name || "").toLowerCase()
      const ownerName = (app.owner_name || "").toLowerCase()
      const appId = (app.id || "").toLowerCase()

      return (
        businessName.includes(query) ||
        ownerName.includes(query) ||
        appId.includes(query)
      )
    })
  }, [applications, activeTab, debouncedSearch])

  // Statistics calculations
  const stats = useMemo(() => {
    const pending = applications.filter(
      (app) => app.status === "WAITING_FOR_APPROVAL" || app.status === "PENDING"
    )
    const correction = applications.filter((app) => app.status === "CORRECTION_REQUIRED").length
    const approved = applications.filter((app) => app.status === "APPROVED").length
    const rejected = applications.filter((app) => app.status === "REJECTED").length

    const queueHealth = pending.length

    let oldestWaiting = "0 hrs"
    if (pending.length > 0) {
      const oldestApp = pending.reduce((oldest, current) => {
        return new Date(current.created_at) < new Date(oldest.created_at) ? current : oldest
      }, pending[0])
      const diffMs = new Date().getTime() - new Date(oldestApp.created_at).getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      
      if (diffHours >= 24) {
        const diffDays = Math.floor(diffHours / 24)
        oldestWaiting = `${diffDays} day${diffDays > 1 ? "s" : ""}`
      } else if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60))
        oldestWaiting = `${diffMins} min${diffMins > 1 ? "s" : ""}`
      } else {
        oldestWaiting = `${diffHours} hr${diffHours > 1 ? "s" : ""}`
      }
    }

    const totalReviewed = approved + rejected + correction
    const correctionRate = totalReviewed > 0 ? Math.round((correction / totalReviewed) * 100) : 0

    return {
      queueHealth,
      oldestWaiting,
      correctionRate,
    }
  }, [applications])

  // Export filtered applications to CSV
  const handleExport = () => {
    if (filteredApplications.length === 0) return

    const headers = [
      "Business",
      "Application ID",
      "Owner",
      "Location",
      "Requested Radius",
      "Documents Status",
      "Submitted Time",
      "Application Status"
    ]

    const rows = filteredApplications.map(app => {
      let docStatus = "Pending Review"
      if (app.status === "CORRECTION_REQUIRED") docStatus = "Correction"
      else if (app.status === "APPROVED") docStatus = "Approved"
      else if (app.status === "REJECTED") docStatus = "Rejected"

      const submittedTime = new Date(app.created_at).toLocaleString()

      return [
        app.name || "",
        app.id || "",
        app.owner_name || "",
        app.city || "",
        `${app.delivery_radius_km || 5} km`,
        docStatus,
        submittedTime,
        app.status || ""
      ]
    })

    exportToCsv(
      `vendor_applications_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#080f14]">Vendor applications</h1>
          {data && (
            <p className="text-[12px] text-[#7e8998] mt-0.5">
              Showing {filteredApplications.length} of {applications.length} total applications
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <DashboardSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search business or owner..."
            className="w-64"
          />
          <Button
            onClick={handleExport}
            disabled={isLoading || filteredApplications.length === 0 || isExporting}
            className="bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] disabled:opacity-50 disabled:pointer-events-none text-white font-bold rounded-full h-11 px-5 text-[13px] shadow-[0_4px_14px_rgba(99,102,241,0.25)] flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            Export queue
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-[#e8e8ef] pb-0">
        {TABS.map((tab) => {
          const count = tabCounts[tab.key as keyof typeof tabCounts]
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-[13px] font-semibold transition-all border-b-2 outline-none focus-visible:text-[#6366F1] focus-visible:border-[#6366F1] ${
                activeTab === tab.key
                  ? "text-[#6366F1] border-[#6366F1]"
                  : "text-[#7e8998] border-transparent hover:text-[#334155]"
              }`}
            >
              {tab.label} {count > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#6366F1] text-[10px] font-bold border border-[#6366F1]/10">{count}</span>}
            </button>
          )
        })}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="lndry-card space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-6 w-1/12" />
          </div>
          <div className="space-y-3 pt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ) : error ? (
        <div className="lndry-card flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
          <h3 className="text-base font-bold text-[#080f14]">Failed to load applications</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">There was an error communicating with the server.</p>
          <Button onClick={() => refetch()} className="bg-[#6366F1] text-white rounded-full flex items-center gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Retry connection
          </Button>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="lndry-card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F8FAFC] border flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-[#94a3b8]" />
          </div>
          <h3 className="text-base font-bold text-[#080f14]">No matching applications found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            {debouncedSearch 
              ? `No onboarding queues match "${debouncedSearch}" under this filter.`
              : `The ${TABS.find(t => t.key === activeTab)?.label.toLowerCase()} applications queue is currently empty.`}
          </p>
        </div>
      ) : (
        <div className="lndry-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-[#e8e8ef]">
                  <th className="lndry-th pb-3">Business</th>
                  <th className="lndry-th pb-3">Owner</th>
                  <th className="lndry-th pb-3">Location</th>
                  <th className="lndry-th pb-3">Requested radius</th>
                  <th className="lndry-th pb-3">Documents</th>
                  <th className="lndry-th pb-3">Submitted</th>
                  <th className="lndry-th pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f4f8]">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-[#fafafd] transition-colors cursor-pointer group">
                    <td className="py-3 px-2">
                      <Link href={`/vendor-applications/${app.id}`} className="block">
                        <div className="font-bold text-[#080f14] group-hover:text-[#6366F1] transition-colors">
                          <HighlightText text={app.name} highlight={debouncedSearch} />
                        </div>
                        <div className="text-[11px] text-[#7e8998] mt-0.5">
                          <HighlightText text={app.id} highlight={debouncedSearch} />
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 px-2 text-[#334155]">
                      <HighlightText text={app.owner_name} highlight={debouncedSearch} />
                    </td>
                    <td className="py-3 px-2 text-[#334155]">{app.city}</td>
                    <td className="py-3 px-2 text-[#334155]">{app.delivery_radius_km} km</td>
                    <td className="py-3 px-2">
                      <DocBadge status={app.status} />
                    </td>
                    <td className="py-3 px-2 text-[#7e8998]">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2">
                      <StatusBadge app={app} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Queue Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="lndry-card transition-all hover:shadow-md">
          <span className="text-[12px] text-[#7e8998] font-semibold">Queue health</span>
          <div className="text-[32px] font-bold text-[#080f14] mt-1">
            {isLoading ? <Skeleton className="h-10 w-16 mt-1" /> : stats.queueHealth}
          </div>
          <div className="text-[11px] text-[#7e8998] mt-1">New and in review</div>
        </div>
        <div className="lndry-card transition-all hover:shadow-md">
          <span className="text-[12px] text-[#7e8998] font-semibold">Oldest waiting</span>
          <div className="text-[32px] font-bold text-[#080f14] mt-1">
            {isLoading ? <Skeleton className="h-10 w-24 mt-1" /> : stats.oldestWaiting}
          </div>
          <div className="text-[11px] text-[#7e8998] mt-1">Within review target</div>
        </div>
        <div className="lndry-card transition-all hover:shadow-md">
          <span className="text-[12px] text-[#7e8998] font-semibold">Correction return rate</span>
          <div className="text-[32px] font-bold text-[#080f14] mt-1">
            {isLoading ? <Skeleton className="h-10 w-20 mt-1" /> : `${stats.correctionRate}%`}
          </div>
          <div className="text-[11px] text-[#7e8998] mt-1">Last 30 days</div>
        </div>
      </div>
    </div>
  )
}

