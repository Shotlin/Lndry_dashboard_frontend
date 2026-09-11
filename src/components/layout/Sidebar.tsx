"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  ChevronLeft,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GalleryHorizontal,
  Gift,
  IndianRupee,
  LayoutDashboard,
  MessageCircleQuestion,
  Radio,
  Store,
  Tags,
  Ticket,
  TrendingUp,
  Users,
  Users2,
  type LucideIcon,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { usePendingActions } from "@/hooks/useDashboard"
import { useMenuVisibility } from "@/hooks/useRBAC"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth.store"
import { useSidebarStore } from "@/store/sidebar.store"

type NavItem = {
  id: string
  label: string
  href: string
  icon: string
  badgeKey?: "pendingOrders" | "pendingApplications" | "exceptionsCount"
}

const ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GalleryHorizontal,
  Gift,
  IndianRupee,
  LayoutDashboard,
  MessageCircleQuestion,
  Radio,
  Store,
  Tags,
  Ticket,
  TrendingUp,
  Users,
  Users2,
}

const NAV_SECTIONS: Array<{ section: string; items: NavItem[] }> = [
  {
    section: "NAVIGATION",
    items: [
      { id: "dashboard", label: "Overview", href: "/dashboard", icon: "LayoutDashboard" },
      { id: "vendorApplications", label: "Vendor applications", href: "/vendor-applications", badgeKey: "pendingApplications", icon: "FileText" },
      { id: "vendors", label: "Vendors", href: "/vendors", icon: "Store" },
      { id: "customers", label: "Customers", href: "/customers", icon: "Users" },
      { id: "orders", label: "Orders", href: "/orders", badgeKey: "pendingOrders", icon: "ClipboardList" },
      { id: "exceptions", label: "Exceptions", href: "/exceptions", badgeKey: "exceptionsCount", icon: "AlertTriangle" },
      { id: "categories", label: "Categories", href: "/laundry-categories", icon: "Tags" },
      { id: "customerSegments", label: "Customer Segments", href: "/customer-segments", icon: "Users2" },
      { id: "coupons", label: "Coupons", href: "/coupons", icon: "Ticket" },
      { id: "firstTimeOffers", label: "First-Time Offers", href: "/first-time-offers", icon: "Gift" },
      { id: "cartMilestones", label: "Cart Milestones", href: "/cart-milestones", icon: "TrendingUp" },
      { id: "fees", label: "Fees", href: "/settings/platform", icon: "IndianRupee" },
      { id: "riderAssignment", label: "Rider Assignment", href: "/settings/rider-assignment", icon: "Radio" },
      { id: "mapsSettings", label: "Maps", href: "/settings/maps", icon: "Map" },
      { id: "incompleteOrders", label: "Incomplete Orders", href: "/incomplete-orders", icon: "AlertTriangle" },
      { id: "banners", label: "Banners", href: "/banners", icon: "GalleryHorizontal" },
      { id: "vendorServices", label: "Service Approvals", href: "/vendor-services", icon: "ClipboardCheck" },
      { id: "supportTickets", label: "Support Tickets", href: "/support-tickets", icon: "MessageCircleQuestion" },
      { id: "notifications", label: "Notifications", href: "/notification-templates", icon: "Bell" },
      { id: "reports", label: "Reports", href: "/reports", icon: "BarChart3" },
      { id: "activityLog", label: "Access and audit", href: "/audit-logs", icon: "Activity" },
    ],
  },
]

function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

interface NavSectionItemProps {
  item: NavItem
  pathname: string
  isCollapsed: boolean
  badgeCount: number
}

function NavSectionItem({
  item,
  pathname,
  isCollapsed,
  badgeCount,
}: NavSectionItemProps) {
  const isActive = isPathActive(pathname, item.href)

  const Icon = ICON_MAP[item.icon]

  const link = (
    <Link
      href={item.href}
      role="menuitem"
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ease-out gap-3",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        isActive
          ? "bg-indigo-500 text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white",
        isCollapsed && "mx-auto w-10 justify-center gap-0 px-0",
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "h-5 w-5 shrink-0 transition-colors",
            isActive ? "text-white" : "text-slate-400"
          )}
        />
      )}
      {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!isCollapsed && badgeCount > 0 && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-white/15 px-1.5 text-[10px] font-bold text-white">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}
    </Link>
  )

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return link
}

interface SidebarSectionProps {
  section: string
  items: NavItem[]
  pathname: string
  isCollapsed: boolean
  badgeCounts: Record<string, number>
}

function SidebarSection({
  items,
  pathname,
  isCollapsed,
  badgeCounts,
}: SidebarSectionProps) {
  const ids = items.map((item) => item.id)
  const visibility = useMenuVisibility(ids)
  const visibleItems = items.filter((item) => visibility[item.id])
  if (visibleItems.length === 0) return null

  return (
    <div className="space-y-1">
      <div className="space-y-1">
        {visibleItems.map((item) => {
          const badgeCount = item.badgeKey
            ? badgeCounts[item.badgeKey] ?? 0
            : 0
          return (
            <NavSectionItem
              key={item.id}
              item={item}
              pathname={pathname}
              isCollapsed={isCollapsed}
              badgeCount={badgeCount}
            />
          )
        })}
      </div>
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { isCollapsed, setCollapsed } = useSidebarStore()
  const { data: pendingActions } = usePendingActions()

  const badgeCounts: Record<string, number> = {
    pendingOrders: pendingActions?.pendingOrders ?? 0,
    pendingApplications: pendingActions?.pendingApplications ?? 0,
    exceptionsCount: pendingActions?.exceptionsCount ?? 0,
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        aria-label="Main navigation"
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden bg-slate-900 text-white transition-[width] duration-300 ease-out",
          isCollapsed ? "w-[72px]" : "w-[244px]"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center px-[18px] transition-all duration-300",
            isCollapsed ? "h-auto flex-col justify-center gap-2 py-4" : "h-[92px] justify-between"
          )}
        >
          {!isCollapsed ? (
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-white p-1.5 flex items-center justify-center overflow-hidden shadow-sm">
                <img
                  src="/lndry-assets/logos/brand-logo.jpg"
                  className="h-full w-full object-contain"
                  alt="LNDRY"
                />
              </div>
              <span className="truncate text-[17px] font-extrabold tracking-wider text-white">LNDRY</span>
            </div>
          ) : (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm cursor-pointer"
              onClick={() => setCollapsed(false)}
              role="button"
              aria-label="Expand sidebar"
              tabIndex={0}
            >
              <img
                src="/lndry-assets/logos/brand-logo.jpg"
                className="h-full w-full object-contain"
                alt="LNDRY"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            className={cn(
              "h-8 w-8 shrink-0 rounded-full border border-white/10 bg-slate-800 text-slate-300 shadow-sm transition-all duration-200 hover:border-white/20 hover:bg-white/5 hover:text-white",
              isCollapsed && "mx-auto"
            )}
            onClick={() => setCollapsed(!isCollapsed)}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform duration-200", isCollapsed && "rotate-180")} />
          </Button>
        </div>

        <ScrollArea className="flex-1 py-0">
          <nav aria-label="Main menu" role="menubar" className={cn("space-y-4", isCollapsed ? "px-2" : "px-[18px]")}>
            {NAV_SECTIONS.map((section) => (
              <SidebarSection
                key={section.section}
                section={section.section}
                items={section.items}
                pathname={pathname}
                isCollapsed={isCollapsed}
                badgeCounts={badgeCounts}
              />
            ))}
          </nav>
        </ScrollArea>

        <div className="shrink-0 p-[18px]">
          <div
            className={cn(
              "flex flex-col rounded-xl bg-slate-800 p-4 text-white",
              isCollapsed && "items-center justify-center p-2"
            )}
          >
            {isCollapsed ? (
              <Avatar className="h-8 w-8 shrink-0 cursor-pointer" onClick={() => setCollapsed(false)}>
                <AvatarFallback className="bg-white/10 text-xs font-semibold text-white">
                  {(user?.name || user?.full_name)?.charAt(0)?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    Operations Admin
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-400">
                    HQ scope · 2FA active
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400">Session active</span>
                  <button
                    onClick={logout}
                    className="text-[10px] text-red-400 hover:text-red-300 font-semibold"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
