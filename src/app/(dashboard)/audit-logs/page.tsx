"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useActivityLogs } from "@/hooks/useActivityLogs"
import { useRoles } from "@/hooks/useRBAC"
import { useSearchFilter } from "@/hooks/useSearchFilter"
import { formatRelativeTime } from "@/lib/utils"
import { QueryStateView } from "@/components/QueryStateView"

function getErrorDetails(error: any) {
  if (!error) return { noPermission: false, message: undefined }
  
  const status = error.response?.status
  const code = error.response?.data?.code
  
  if (status === 401) {
    return { noPermission: false, message: "Unauthorized — please login again." }
  }
  if (status === 403 || code === "PERMISSION_DENIED") {
    return { noPermission: true, message: "Access Denied — you do not have permission to view audit logs." }
  }
  if (status === 404) {
    return { noPermission: false, message: "API endpoint not found. Please contact support." }
  }
  if (error.message === "Network Error") {
    return { noPermission: false, message: "Network error — please check your internet connection." }
  }
  
  return { noPermission: false, message: error.response?.data?.message || error.message || "An unexpected server error occurred." }
}

function resultColor(result: string): string {
  const r = result?.toLowerCase() || ""
  if (r === "success" || r === "allowed" || r === "ok") return "bg-[#ECFDF5] text-[#047857]"
  if (r === "denied" || r === "failed" || r === "error") return "bg-[#FEF2F2] text-[#B91C1C]"
  return "bg-[#FEF3C7] text-[#B45309]"
}

export default function ActivityLogPage() {
  const [page, setPage] = useState(1)
  const { search, setSearch, debouncedSearch } = useSearchFilter()
  const { data: rolesData, isLoading: rolesLoading, isError: rolesError, error: rolesErrorObj, refetch: refetchRoles } = useRoles()
  const { data: logsData, isLoading: logsLoading, isError: logsError, error: logsErrorObj, refetch } = useActivityLogs({ page, limit: 20 })

  const isError = logsError || rolesError
  const errorObj = logsErrorObj || rolesErrorObj
  const onRetry = () => {
    refetch()
    refetchRoles()
  }

  const { noPermission, message: errorMessage } = useMemo(() => {
    return getErrorDetails(errorObj)
  }, [errorObj])

  const roles: any[] = Array.isArray(rolesData) ? rolesData : []
  const rawLogs: any[] = logsData?.items ?? []
  const pagination = { page: logsData?.page ?? page, totalPages: Math.ceil((logsData?.total ?? 0) / (logsData?.limit ?? 20)), total: logsData?.total ?? 0 }

  // Client-side search filter on logs
  const filteredLogs = useMemo(() => {
    if (!debouncedSearch) return rawLogs
    const q = debouncedSearch.toLowerCase()
    return rawLogs.filter(
      (log: any) =>
        (log.actor_role || "").toLowerCase().includes(q) ||
        (log.action || "").toLowerCase().includes(q) ||
        (log.target_type || "").toLowerCase().includes(q) ||
        (log.target_id || "").toLowerCase().includes(q) ||
        (log.after?.email || "").toLowerCase().includes(q)
    )
  }, [rawLogs, debouncedSearch])

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
        <h1 className="text-[28px] font-bold tracking-tight text-[#080f14]">Roles, permissions, and audit</h1>
        <Link href="/admin-employees">
          <Button className="bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white font-bold rounded-full h-10 px-5 text-[13px] shadow-[0_4px_14px_rgba(6,182,212,0.25)]">
            Add admin user
          </Button>
        </Link>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {rolesLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="lndry-card flex flex-col justify-between min-h-[140px]">
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-3 w-20 mb-3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-1" />
              </div>
            </div>
          ))
        ) : roles.length === 0 ? (
          <div className="col-span-3 lndry-card text-center py-8">
            <p className="text-[13px] text-[#7e8998]">No roles configured. Visit <Link href="/admin-employees" className="text-[#6366F1] font-semibold">Admin Employees</Link> to manage roles.</p>
          </div>
        ) : (
          roles.slice(0, 3).map((role: any, i: number) => (
            <div key={role.id || i} className="lndry-card flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-[#080f14]">{role.name}</h3>
                  <span className="inline-flex px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#6366F1] text-[10px] font-bold border border-[#6366F1]/10">
                    {role.member_count ?? role.users_count ?? "—"} users
                  </span>
                </div>
                <span className="text-[11px] text-[#7e8998] font-medium">{role.scope ?? role.description?.slice(0, 30) ?? "Custom scope"}</span>
                <p className="text-[12px] text-[#7e8998] mt-2 leading-relaxed">{role.description ?? "Role for platform operations."}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Security audit log */}
      <div className="lndry-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-bold text-[#080f14]">Security audit log</h2>
            <p className="text-[12px] text-[#7e8998] mt-0.5">Authentication, role, decision, override, and export events</p>
          </div>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94a3b8]" />
            <Input
              placeholder="Search audit log"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 rounded-full bg-[#fafafd] border-[#e8e8ef] text-[12px]"
            />
          </div>
        </div>

        {logsError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-[14px] text-[#B91C1C] font-semibold mb-3">Failed to load audit logs</p>
            <Button onClick={() => refetch()} variant="outline" className="rounded-full text-[13px] font-bold">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e8e8ef]">
                  <th className="lndry-th">Time</th>
                  <th className="lndry-th">Admin</th>
                  <th className="lndry-th">Action</th>
                  <th className="lndry-th">Target</th>
                  <th className="lndry-th">Scope</th>
                  <th className="lndry-th">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f4f8]">
                {logsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-4 px-2"><Skeleton className="h-4 w-16" /></td>
                      <td className="py-4 px-2"><Skeleton className="h-4 w-20" /></td>
                      <td className="py-4 px-2"><Skeleton className="h-4 w-28" /></td>
                      <td className="py-4 px-2"><Skeleton className="h-4 w-20" /></td>
                      <td className="py-4 px-2"><Skeleton className="h-4 w-20" /></td>
                      <td className="py-4 px-2"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <p className="text-[14px] text-[#7e8998] font-medium">No audit logs found</p>
                      {debouncedSearch && <p className="text-[12px] text-[#94a3b8] mt-1">Try adjusting your search query</p>}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log: any) => {
                    const isSuccess = typeof log?.action === "string" ? (log.action.endsWith("_success") || !log.action.includes("fail")) : true
                    const statusStr = isSuccess ? "Success" : "Failed"
                    // Try multiple possible actor name fields from the backend
                    const actorName = log.actor_name || log.admin_name || log.performed_by_name ||
                      (() => {
                        const emailParts = typeof log?.after?.email === "string" ? log.after.email.split("@") : []
                        return emailParts[0]
                          ? emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1)
                          : "System"
                      })()

                    return (
                      <tr key={log.id} className="hover:bg-[#fafafd] transition-colors">
                        <td className="py-3.5 px-4 text-[#64748B] whitespace-nowrap">
                          {formatRelativeTime(log.created_at)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#080f14]">
                          {actorName}
                        </td>
                        <td className="py-3.5 px-4 text-[#334155]">
                          <span className="font-mono bg-[#F8FAFC] px-1.5 py-0.5 rounded text-[11px] border border-[#E2E8F0]">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B] max-w-[160px] truncate">
                          {log.target_id || log.entity_id || "-"}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B]">
                          {log.target_type || log.entity_type || log.actor_role || "-"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${resultColor(statusStr)}`}>
                            {statusStr}
                          </span>
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
        {!logsLoading && filteredLogs.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-[12px] text-[#7e8998]">
              Page {pagination.page ?? page} of {pagination.totalPages ?? 1}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-full h-8 px-3 text-[12px]" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
              </Button>
              <Button variant="outline" size="sm" className="rounded-full h-8 px-3 text-[12px]" disabled={page >= (pagination.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  </QueryStateView>
  )
}
