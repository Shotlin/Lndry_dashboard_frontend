"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Bike,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileText,
  Image,
  LayoutDashboard,
  MessageCircleQuestion,
  Settings,
  Shield,
  Store,
  Tags,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useMenuVisibility } from "@/hooks/useRBAC"
import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/store/sidebar.store"

type NavItem = {
  id: string
  label: string
  href: string
  icon: string
}

const ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Bike,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileText,
  Image,
  LayoutDashboard,
  MessageCircleQuestion,
  Settings,
  Shield,
  Store,
  Tags,
  Ticket,
  Users,
}

const NAV_SECTIONS: Array<{ section: string; items: NavItem[] }> = [
  {
    section: "OVERVIEW",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    ],
  },
  {
    section: "OPERATIONS",
    items: [
      { id: "vendorApplications", label: "Vendor Applications", href: "/vendor-applications", icon: "FileText" },
      { id: "vendors", label: "Vendors", href: "/vendors", icon: "Store" },
      { id: "orders", label: "Orders", href: "/orders", icon: "ClipboardList" },
      { id: "exceptions", label: "Exceptions", href: "/exceptions", icon: "AlertTriangle" },
      { id: "customers", label: "Customers", href: "/customers", icon: "Users" },
      { id: "deliveryEmployees", label: "Delivery Employees", href: "/delivery-employees", icon: "Bike" },
      { id: "supportTickets", label: "Support Tickets", href: "/support-tickets", icon: "MessageCircleQuestion" },
    ],
  },
  {
    section: "CATALOGUE",
    items: [
      { id: "categories", label: "Laundry Categories", href: "/laundry-categories", icon: "Tags" },
      { id: "vendorServices", label: "Service Approvals", href: "/vendor-services", icon: "ClipboardCheck" },
      { id: "coupons", label: "Coupons", href: "/coupons", icon: "Ticket" },
    ],
  },
  {
    section: "FINANCE",
    items: [
      { id: "payments", label: "Payments & Refunds", href: "/payments", icon: "CreditCard" },
    ],
  },
  {
    section: "INSIGHTS",
    items: [
      { id: "reports", label: "Reports", href: "/reports", icon: "BarChart3" },
    ],
  },
  {
    section: "SECURITY",
    items: [
      { id: "activityLog", label: "Audit Log", href: "/audit-logs", icon: "Activity" },
      { id: "team", label: "Admin Employees", href: "/admin-employees", icon: "Shield" },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      { id: "notifications", label: "Notification Templates", href: "/notification-templates", icon: "Bell" },
      { id: "watermark", label: "Watermark Settings", href: "/watermark", icon: "Image" },
      { id: "settings", label: "Settings", href: "/settings", icon: "Settings" },
    ],
  },
]

function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

interface MobileSectionProps {
  section: string
  items: NavItem[]
  pathname: string
  onClose: () => void
}

function MobileSection({
  section,
  items,
  pathname,
  onClose,
}: MobileSectionProps) {
  const ids = items.map((item) => item.id)
  const visibility = useMenuVisibility(ids)
  const visibleItems = items.filter((item) => visibility[item.id])
  if (visibleItems.length === 0) return null

  return (
    <div className="space-y-1">
      <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {section}
      </p>
      <div className="space-y-0.5">
        {visibleItems.map((item) => {
          const Icon = ICON_MAP[item.icon]
          const isActive = isPathActive(pathname, item.href)

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2 text-sm transition-all duration-150",
                isActive
                  ? "border-brand-500 bg-brand-50 font-semibold text-brand-500"
                  : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-brand-500" : "text-muted-foreground",
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function MobileNav() {
  const pathname = usePathname()
  const { isOpen, toggle } = useSidebarStore()

  return (
    <Sheet open={isOpen} onOpenChange={toggle}>
      <SheetContent side="left" className="w-[260px] p-0 border-0 bg-background">
        <div className="flex h-16 items-center gap-3 px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-[#e8e8ef] p-1 flex items-center justify-center overflow-hidden shadow-sm">
            <img src="/lndry-assets/logos/brand-logo.jpg" className="h-full w-full object-contain" alt="LNDRY" />
          </div>
          <span className="text-base font-bold text-foreground">
            LNDRY Admin
          </span>
        </div>

        <Separator />

        <ScrollArea className="h-[calc(100vh-65px)] py-3">
          <nav aria-label="Mobile menu" className="space-y-4 px-3">
            {NAV_SECTIONS.map((section) => (
              <MobileSection
                key={section.section}
                section={section.section}
                items={section.items}
                pathname={pathname}
                onClose={toggle}
              />
            ))}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
