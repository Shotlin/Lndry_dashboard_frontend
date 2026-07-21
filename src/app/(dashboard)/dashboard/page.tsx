"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useDashboardStats,
  useRecentOrders,
  usePendingActions,
  useRevenueChart,
} from "@/hooks/useDashboard"
import { useQuery } from "@tanstack/react-query"
import { getVendorsList } from "@/services/vendors.service"
import { formatRelativeTime, cn } from "@/lib/utils"
import { GlobalSearch } from "@/components/layout/GlobalSearch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/store/auth.store"
import { useTheme } from "next-themes"
import { DARK_MODE_ENABLED } from "@/components/providers/ThemeProvider"

/* ── Status badge component matching mockup pill style ── */
function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase()
  if (s === "PENDING" || s === "WAITING_VENDOR_CONFIRMATION" || s === "WAITING_VENDOR") {
    return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] font-bold text-[10px]">Waiting vendor</span>
  }
  if (s === "CANCELLED" || s === "PAYMENT_FAILED" || s === "REJECTED") {
    return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FEF2F2] text-[#B91C1C] font-bold text-[10px]">Cancelled</span>
  }
  if (s === "OUT_FOR_DELIVERY" || s === "SHIPPED") {
    return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857] font-bold text-[10px] border border-[#047857]/20">Out for delivery</span>
  }
  return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857] font-bold text-[10px]">Processing</span>
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: stats, isLoading: statsLoading } = useDashboardStats("week")
  const { data: pendingActions, isLoading: pendingLoading } = usePendingActions()
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders(5)
  const { data: revenueData } = useRevenueChart(7)
  const { data: vendorData } = useQuery({
    queryKey: ["vendors", "active-count"],
    queryFn: () => getVendorsList({ limit: 1, status: "APPROVED" }),
    staleTime: 60 * 1000,
  })
  const activeVendorCount = vendorData?.total ?? null

  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { theme, setTheme } = useTheme()

  const userInitials = useMemo(() => {
    const name = user?.name || user?.full_name || "Operations Admin"
    const parts = name.split(" ")
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }, [user])

  /* Chart data — indigo bars matching dashboard-v1.png */
  const chartFallback = [
    { percentage: 42, label: "Mon" },
    { percentage: 55, label: "Tue" },
    { percentage: 50, label: "Wed" },
    { percentage: 58, label: "Thu" },
    { percentage: 54, label: "Fri" },
    { percentage: 88, label: "Sat" },
    { percentage: 78, label: "Sun" },
  ]

  const chartData = revenueData && revenueData.length > 0
    ? (() => {
        const maxOrders = Math.max(...revenueData.map((d) => d.orders), 1)
        const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        return revenueData.slice(-7).map((d) => {
          const dateObj = new Date(d.date)
          const label = daysOfWeek[dateObj.getDay()]
          const percentage = Math.round((d.orders / maxOrders) * 80) + 12
          return { percentage, label, val: d.orders }
        })
      })()
    : chartFallback

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-[#080f14]">Operations overview</h1>
        <div className="flex items-center gap-3">
          <GlobalSearch
            className="w-72 flex-none max-w-none"
            inputClassName="pl-10 h-11 rounded-full bg-white border-[#e8e8ef] text-[13px] shadow-[0_1px_3px_rgba(42,36,95,0.04)]"
            searchIconClassName="left-4 text-[#94a3b8]"
            hideKbd={true}
            placeholder="Search orders, vendors, customers"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="User profile menu"
                className="w-10 h-10 rounded-full bg-[#6366F1] text-white flex items-center justify-center font-bold text-sm select-none shrink-0 cursor-pointer transition-all hover:opacity-90 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6366F1]"
              >
                {userInitials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none truncate">{user?.name || user?.full_name || "Operations Admin"}</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user?.email || "admin@lndry.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/me" className="w-full cursor-pointer">
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="w-full cursor-pointer">
                  Account Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }))
                }}
              >
                Keyboard Shortcuts
              </DropdownMenuItem>
              {DARK_MODE_ENABLED && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer">Theme</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme("light")}>
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme("dark")}>
                      Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme("system")}>
                      System
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                onClick={() => logout()}
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── KPI Cards Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Orders today */}
        <div className="lndry-card flex flex-col justify-between min-h-[110px]">
          <span className="text-[12px] text-[#7e8998]">Orders today</span>
          <strong className="text-[32px] font-bold tracking-tight text-[#080f14] mt-1">
            {statsLoading ? <Skeleton className="h-9 w-16 mt-1" /> : (stats?.today?.orders ?? 0)}
          </strong>
          <div className="text-[11px] text-[#047857] font-bold mt-1">Today so far</div>
        </div>

        {/* Waiting vendor response */}
        <div className="lndry-card flex flex-col justify-between min-h-[110px]">
          <span className="text-[12px] text-[#7e8998]">Waiting vendor response</span>
          <strong className="text-[32px] font-bold tracking-tight text-[#080f14] mt-1">
            {pendingLoading ? <Skeleton className="h-9 w-16 mt-1" /> : (pendingActions?.pendingOrders ?? 0)}
          </strong>
          <div className="text-[11px] text-[#B45309] font-bold mt-1">{pendingActions?.pendingOrders ? `${pendingActions.pendingOrders} pending review` : "None pending"}</div>
        </div>

        {/* Active vendors */}
        <div className="lndry-card flex flex-col justify-between min-h-[110px]">
          <span className="text-[12px] text-[#7e8998]">Active vendors</span>
          <strong className="text-[32px] font-bold tracking-tight text-[#080f14] mt-1">
            {statsLoading ? <Skeleton className="h-9 w-16 mt-1" /> : (activeVendorCount ?? "—")}
          </strong>
          <div className="text-[11px] text-[#047857] font-bold mt-1">{activeVendorCount ? `${activeVendorCount} registered` : "Loading..."}</div>
        </div>

        {/* Open exceptions */}
        <div className="lndry-card flex flex-col justify-between min-h-[110px]">
          <span className="text-[12px] text-[#7e8998]">Open exceptions</span>
          <strong className="text-[32px] font-bold tracking-tight text-[#080f14] mt-1">
            {pendingLoading ? <Skeleton className="h-9 w-16 mt-1" /> : (pendingActions?.exceptionsCount ?? 0)}
          </strong>
          <div className="text-[11px] text-[#B91C1C] font-bold mt-1">{pendingActions?.exceptionsCount ? `${pendingActions.exceptionsCount} require attention` : "All clear"}</div>
        </div>
      </div>

      {/* ── Middle Row: Chart + Operational Attention ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Order volume chart — indigo bars matching mockup */}
        <div className="lndry-card flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-[#080f14]">Order volume</h2>
              <p className="text-[12px] text-[#7e8998]">Last 7 days</p>
            </div>
            <span className="inline-flex px-2.5 py-1.5 rounded-full bg-[#EEF2FF] text-[#6366F1] text-[11px] font-bold border border-[#6366F1]/10">
              Daily
            </span>
          </div>
          <div className="h-[190px] flex items-end gap-3 pt-6">
            {chartData.map((item, index) => {
              const isHighlighted = index === 2 || index === 5
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="relative w-full group">
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-[#1f2937] text-white text-[10px] py-1 px-2 rounded-lg shadow-lg whitespace-nowrap z-10 font-bold">
                      {(item as any).val !== undefined ? `${(item as any).val} orders` : `${item.percentage}%`}
                    </div>
                    <div
                      style={{ height: `${item.percentage}%` }}
                      className={cn(
                        "w-full rounded-t-md transition-all duration-300 min-h-[8%]",
                        isHighlighted ? "bg-[#6366F1]" : "bg-[#C7D2FE] hover:bg-[#A5B4FC]"
                      )}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Operational attention — matching mockup exactly */}
        <div className="lndry-card flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-[#080f14]">Operational attention</h2>
              <p className="text-[12px] text-[#7e8998]">Sorted by impact</p>
            </div>
            <Link href="/exceptions" className="text-[13px] font-semibold text-[#6366F1] hover:text-[#4F46E5] transition-colors">
              View exceptions
            </Link>
          </div>
          <div className="divide-y divide-[#f0f0f5] mt-4 flex-1 flex flex-col justify-between">
            {pendingLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))
            ) : (
              <>
                <div className="py-3 flex items-center justify-between text-[13px]">
                  <span className="text-[#080f14] font-medium">Payment reconciliation pending</span>
                  <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FEF2F2] text-[#B91C1C] text-[10px] font-bold">{pendingActions?.exceptionsCount ?? 0} orders</span>
                </div>
                <div className="py-3 flex items-center justify-between text-[13px]">
                  <span className="text-[#080f14] font-medium">Vendor response timeout risk</span>
                  <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FEF2F2] text-[#B91C1C] text-[10px] font-bold">{pendingActions?.pendingOrders ?? 0} orders</span>
                </div>
                <div className="py-3 flex items-center justify-between text-[13px]">
                  <span className="text-[#080f14] font-medium">Vendor applications waiting</span>
                  <span className="inline-flex px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857] text-[10px] font-bold">{pendingActions?.pendingApplications ?? 0}</span>
                </div>
                <div className="py-3 flex items-center justify-between text-[13px]">
                  <span className="text-[#080f14] font-medium">Rider approvals pending</span>
                  <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold">{pendingActions?.pendingRiderApprovals ?? 0}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Order Activity Table ── */}
      <div className="lndry-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[15px] font-bold text-[#080f14]">Recent order activity</h2>
            <p className="text-[12px] text-[#7e8998]">Scoped real-time events</p>
          </div>
          <span className="inline-flex px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857] text-[10px] font-bold border border-[#047857]/15">
            Live updates
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#e8e8ef]">
                <th className="lndry-th">Order</th>
                <th className="lndry-th">Customer</th>
                <th className="lndry-th">Vendor</th>
                <th className="lndry-th">Status</th>
                <th className="lndry-th">Payment</th>
                <th className="lndry-th">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f4f8]">
              {ordersLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-2"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-4 px-2"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-2"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-4 px-2"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="py-4 px-2"><Skeleton className="h-4 w-12" /></td>
                    <td className="py-4 px-2"><Skeleton className="h-4 w-16" /></td>
                  </tr>
                ))
              ) : recentOrders && recentOrders.length > 0 ? (
                recentOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-[#fafafd] transition-colors cursor-pointer" onClick={() => router.push(`/orders/${order.id}`)}>
                    <td className="py-4 px-2 font-bold text-[#080f14]">
                      <Link href={`/orders/${order.id}`} className="hover:text-[#6366F1] transition-colors" onClick={(e) => e.stopPropagation()}>#{order.order_number}</Link>
                    </td>
                    <td className="py-4 px-2 text-[#334155]">{order.customer_name || "Guest"}</td>
                    <td className="py-4 px-2 text-[#334155]">{(order as any).shop_name || "Vendor"}</td>
                    <td className="py-4 px-2"><StatusBadge status={order.status} /></td>
                    <td className="py-4 px-2 text-[#334155]">{(order as any).payment_status === "PAID" ? "Paid" : "Pending"}</td>
                    <td className="py-4 px-2 text-[#7e8998]">{formatRelativeTime(order.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[13px] text-[#7e8998]">
                    No recent orders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
