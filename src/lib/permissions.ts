/**
 * RBAC Permission Map — LNDRY Admin Operations Dashboard
 */

export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "FINANCE_ADMIN"
  | "ADMIN_EMPLOYEE"
  | "CUSTOMER"

export type PermissionToken =
  | "dashboard.read"
  | "vendor_applications.read"
  | "vendor_applications.write"
  | "vendor_applications.review"
  | "vendors.read"
  | "vendors.write"
  | "vendors.suspend"
  | "orders.read"
  | "orders.write"
  | "orders.override"
  | "orders.assign"
  | "exceptions.read"
  | "exceptions.write"
  | "customers.read"
  | "customers.write"
  | "delivery_employees.read"
  | "delivery_employees.write"
  | "delivery_employees.approve"
  | "categories.read"
  | "categories.write"
  | "categories.delete"
  | "payments.read"
  | "payments.refund"
  | "reports.read"
  | "reports.export"
  | "audit.read"
  | "settings.read"
  | "settings.write"
  | "watermark.manage"
  | "roles.manage"
  | "team.manage"

export interface RouteGuard {
  pattern: RegExp
  anyOf?: PermissionToken[]
  allOf?: PermissionToken[]
  rolesAllowed?: Role[]
  superAdminOnly?: boolean
}

export interface MenuPermission {
  key: string
  anyOf?: PermissionToken[]
  allOf?: PermissionToken[]
  superAdminOnly?: boolean
}

export const ROUTE_GUARDS: RouteGuard[] = [
  // New LNDRY Routes
  { pattern: /^\/vendor-applications$/, anyOf: ["vendor_applications.read"] },
  { pattern: /^\/vendor-applications\/[^/]+$/, anyOf: ["vendor_applications.read"] },
  { pattern: /^\/vendor-applications\/[^/]+\/decision$/, anyOf: ["vendor_applications.review"] },
  { pattern: /^\/vendor-applications\/[^/]+\/radius$/, anyOf: ["vendor_applications.review"] },
  { pattern: /^\/vendors$/, anyOf: ["vendors.read"] },
  { pattern: /^\/vendors\/[^/]+$/, anyOf: ["vendors.read"] },
  { pattern: /^\/exceptions$/, anyOf: ["exceptions.read"] },
  { pattern: /^\/customers$/, anyOf: ["customers.read"] },
  { pattern: /^\/customer-segments$/, anyOf: ["customers.read"] },
  { pattern: /^\/delivery-employees$/, anyOf: ["delivery_employees.read"] },
  { pattern: /^\/laundry-categories$/, anyOf: ["categories.read"] },
  { pattern: /^\/coupons$/, anyOf: ["settings.read"] },
  { pattern: /^\/first-time-offers$/, anyOf: ["settings.read"] },
  { pattern: /^\/incomplete-orders$/, anyOf: ["orders.read"] },
  { pattern: /^\/banners$/, anyOf: ["settings.read"] },
  { pattern: /^\/payments$/, anyOf: ["payments.read"] },
  { pattern: /^\/reports$/, anyOf: ["reports.read"] },
  { pattern: /^\/settings$/, anyOf: ["settings.read"] },
  { pattern: /^\/watermark$/, anyOf: ["watermark.manage"] },
  { pattern: /^\/(team|admin-employees)$/, anyOf: ["team.manage"] },
  { pattern: /^\/(activity-log|audit-logs)$/, anyOf: ["audit.read"] },
  { pattern: /^\/(notifications|notification-templates)$/, anyOf: ["settings.read"] },
  { pattern: /^\/admin-states$/, anyOf: ["dashboard.read"] },
]

export const MENU_PERMISSIONS: Record<string, MenuPermission> = {
  dashboard: { key: "dashboard", anyOf: ["dashboard.read"] },
  adminStates: { key: "adminStates", anyOf: ["dashboard.read"] },
  vendorApplications: { key: "vendorApplications", anyOf: ["vendor_applications.read"] },
  vendors: { key: "vendors", anyOf: ["vendors.read"] },
  orders: { key: "orders", anyOf: ["orders.read"] },
  exceptions: { key: "exceptions", anyOf: ["exceptions.read"] },
  customers: { key: "customers", anyOf: ["customers.read"] },
  customerSegments: { key: "customerSegments", anyOf: ["customers.read"] },
  deliveryEmployees: { key: "deliveryEmployees", anyOf: ["delivery_employees.read"] },
  categories: { key: "categories", anyOf: ["categories.read"] },
  coupons: { key: "coupons", anyOf: ["settings.write"] },
  firstTimeOffers: { key: "firstTimeOffers", anyOf: ["settings.write"] },
  cartMilestones: { key: "cartMilestones", anyOf: ["settings.write"] },
  incompleteOrders: { key: "incompleteOrders", anyOf: ["orders.read"] },
  banners: { key: "banners", anyOf: ["settings.write"] },
  payments: { key: "payments", anyOf: ["payments.read"] },
  reports: { key: "reports", anyOf: ["reports.read"] },
  settings: { key: "settings", anyOf: ["settings.read"] },
  watermark: { key: "watermark", anyOf: ["watermark.manage"] },
  team: { key: "team", anyOf: ["team.manage"] },
  activityLog: { key: "activityLog", anyOf: ["audit.read"] },
}

export interface PermissionSubject {
  role: string
  permissions: string[]
}

export function satisfies(
  user: PermissionSubject,
  guard: Pick<RouteGuard, "superAdminOnly" | "rolesAllowed" | "allOf" | "anyOf">,
): boolean {
  if (guard.superAdminOnly && user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    return false
  }
  if (guard.rolesAllowed && !guard.rolesAllowed.includes(user.role as Role) && user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    return false
  }
  if (guard.allOf && !guard.allOf.every((p) => user.permissions.includes(p))) {
    return false
  }
  if (guard.anyOf && !guard.anyOf.some((p) => user.permissions.includes(p))) {
    return false
  }
  return true
}

export function findRouteGuard(pathname: string): RouteGuard | null {
  for (const guard of ROUTE_GUARDS) {
    if (guard.pattern.test(pathname)) return guard
  }
  return null
}

export function isMenuItemAllowed(
  itemId: string,
  user: PermissionSubject
): boolean {
  const perm = MENU_PERMISSIONS[itemId]
  if (!perm) return true

  if (perm.superAdminOnly && user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    return false
  }

  return satisfies(user, perm)
}

export const ROLE_DEFAULTS: Record<Exclude<Role, "SUPER_ADMIN" | "ADMIN">, PermissionToken[]> = {
  FINANCE_ADMIN: [
    "dashboard.read",
    "orders.read",
    "payments.read",
    "payments.refund",
    "reports.read",
    "reports.export",
    "audit.read",
  ],
  ADMIN_EMPLOYEE: [
    "dashboard.read",
    "orders.read",
    "exceptions.read",
    "customers.read",
  ],
  CUSTOMER: [],
}

export function primaryEntityFor(guard: RouteGuard): string | null {
  const token = guard.anyOf?.[0] || guard.allOf?.[0]
  if (!token) return null
  return token.split(".")[0]
}

export function entityOf(token: string): string | null {
  if (!token || !token.includes(".")) return null
  const parts = token.split(".")
  if (parts.length < 2 || !parts[0] || !parts[1]) return null
  return parts[0]
}

export const ALL_FRONTEND_PERMISSIONS: PermissionToken[] = [
  "dashboard.read",
  "vendor_applications.read",
  "vendor_applications.write",
  "vendor_applications.review",
  "vendors.read",
  "vendors.write",
  "vendors.suspend",
  "orders.read",
  "orders.write",
  "orders.override",
  "orders.assign",
  "exceptions.read",
  "exceptions.write",
  "customers.read",
  "customers.write",
  "delivery_employees.read",
  "delivery_employees.write",
  "delivery_employees.approve",
  "categories.read",
  "categories.write",
  "categories.delete",
  "payments.read",
  "payments.refund",
  "reports.read",
  "reports.export",
  "audit.read",
  "settings.read",
  "settings.write",
  "watermark.manage",
  "roles.manage",
  "team.manage"
]

export function translatePermissions(perms: string[], role?: string): PermissionToken[] {
  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    return ALL_FRONTEND_PERMISSIONS
  }

  const result = new Set<PermissionToken>()

  const mapping: Record<string, PermissionToken[]> = {
    "audit_logs.view": ["audit.read"],
    "finance.global_view": ["payments.read", "reports.read"],
    "reports.global_view": ["reports.read"],
    "riders.approve": ["delivery_employees.approve"],
    "riders.assign": ["delivery_employees.write"],
    "riders.view": ["delivery_employees.read"],
    "shop_coupons.create": ["settings.write"],
    "shop_coupons.delete": ["settings.write"],
    "shop_coupons.update": ["settings.write"],
    "shop_coupons.view": ["settings.read"],
    "shop_financials.export": ["payments.refund", "payments.read"],
    "shop_financials.mark_paid": ["payments.read"],
    "shop_financials.view": ["payments.read"],
    "shop_orders.assign_rider": ["orders.assign"],
    "shop_orders.cancel": ["orders.write"],
    "shop_orders.export": ["orders.read"],
    "shop_orders.refund": ["payments.refund"],
    "shop_orders.update_status": ["orders.write"],
    "shop_orders.view": ["orders.read"],
    "vendor_services.approve": ["categories.write"],
    "vendor_services.bulk_update": ["categories.write"],
    "vendor_services.create": ["categories.write"],
    "vendor_services.delete": ["categories.delete"],
    "vendor_services.update": ["categories.write"],
    "vendor_services.view": ["categories.read"],
    "shop_reports.view": ["reports.read"],
    "vendor_staff.create": ["vendors.write"],
    "vendor_staff.delete": ["vendors.write"],
    "vendor_staff.reset_password": ["vendors.write"],
    "vendor_staff.update": ["vendors.write"],
    "vendor_staff.view": ["vendors.read"],
    "shop_transactions.export": ["payments.read"],
    "shop_transactions.view": ["payments.read"],
    "vendors.create": ["vendor_applications.write"],
    "vendors.delete": ["vendors.write"],
    "vendors.update": ["vendors.write"],
    "vendors.view": ["vendors.read"],
  }

  for (const p of perms) {
    if (ALL_FRONTEND_PERMISSIONS.includes(p as PermissionToken)) {
      result.add(p as PermissionToken)
    }
    const mapped = mapping[p]
    if (mapped) {
      for (const m of mapped) {
        result.add(m)
      }
    }
  }

  if (perms.includes("vendors.view")) {
    result.add("vendor_applications.read")
    result.add("customers.read")
  }
  if (perms.includes("vendors.update") || perms.includes("vendors.create")) {
    result.add("vendor_applications.write")
    result.add("vendor_applications.review")
    result.add("customers.write")
  }
  if (perms.includes("shop_orders.view")) {
    result.add("exceptions.read")
    result.add("dashboard.read")
  }
  if (perms.includes("shop_orders.update_status")) {
    result.add("exceptions.write")
  }

  return Array.from(result)
}
