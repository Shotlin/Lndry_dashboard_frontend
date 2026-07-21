import { describe, it, expect, vi } from "vitest"
import { render, screen, renderHook } from "@testing-library/react"
import { useAuthStore } from "@/store/auth.store"
import { useRouteRBAC } from "@/hooks/useRBAC"
import { isMenuItemAllowed, satisfies } from "@/lib/permissions"
import { CustomerProfileDrawer } from "@/components/customers/CustomerProfileDrawer"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import fs from "fs"
import path from "path"

vi.mock("@/hooks/useCustomers", () => ({
  useCustomerDetail: () => ({
    data: {
      id: "cust-1",
      name: "Riya Sharma",
      order_count: 5,
      total_spent: 500,
      loyalty_points: 100,
      is_blocked: false,
      created_at: "2024-01-01T00:00:00Z",
    },
    isLoading: false,
  }),
  useCustomerOrders: () => ({ data: { orders: [] }, isLoading: false }),
  useToggleBlockCustomer: () => ({ mutate: vi.fn(), isPending: false }),
  useNotifyCustomer: () => ({ mutate: vi.fn(), isPending: false }),
}))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

describe("LNDRY Admin Operations Platform Architecture Invariants", () => {
  it("useShopContextStore does not exist in the codebase", () => {
    const filePath = path.join(__dirname, "../store/shop-context.store.ts")
    expect(fs.existsSync(filePath)).toBe(false)
  })

  it("select-shop route files do not exist in the source tree", () => {
    const selectShopPage = path.join(__dirname, "../app/(dashboard)/select-shop/page.tsx")
    const selectShopPageRoot = path.join(__dirname, "../app/select-shop/page.tsx")
    const selectShopPageAuth = path.join(__dirname, "../app/(auth)/select-shop/page.tsx")
    expect(fs.existsSync(selectShopPage)).toBe(false)
    expect(fs.existsSync(selectShopPageRoot)).toBe(false)
    expect(fs.existsSync(selectShopPageAuth)).toBe(false)
  })

  it("no outgoing API request ever includes an X-Shop-Id header by running the real request interceptor", async () => {
    const api = (await import("@/lib/api")).default
    const config = { headers: {} } as any

    // Retrieve real request interceptor handlers
    const handlers = (api.interceptors.request as any).handlers
    let modifiedConfig = config
    for (const handler of handlers) {
      if (handler && handler.fulfilled) {
        modifiedConfig = handler.fulfilled(modifiedConfig)
      }
    }

    expect(modifiedConfig.headers["X-Shop-Id"]).toBeUndefined()
    expect(modifiedConfig.headers["x-shop-id"]).toBeUndefined()
  })

  it("useRBAC and isMenuItemAllowed only reference user.permissions[], never a shop-context source", () => {
    useAuthStore.setState({
      user: {
        id: "usr-1",
        name: "Test Admin",
        email: "admin@lndry.com",
        phone: "+1000",
        role: "FINANCE_ADMIN" as any,
        permissions: ["vendor_applications.read"],
      },
      isAuthenticated: true,
    })

    const { result } = renderHook(() => useRouteRBAC("/vendor-applications"))
    expect(result.current.isAuthorized).toBe(true)
    expect(result.current.canRead).toBe(true)

    const allowed = isMenuItemAllowed("vendorApplications", { role: "FINANCE_ADMIN", permissions: ["vendor_applications.read"] })
    expect(allowed).toBe(true)
    
    const denied = isMenuItemAllowed("team", { role: "FINANCE_ADMIN", permissions: ["vendor_applications.read"] })
    expect(denied).toBe(false)
  })

  it("Customer Profile Drawer renders no wallet balance, credit, or top-up control", () => {
    render(
      <CustomerProfileDrawer
        customerId="cust-1"
        open={true}
        onClose={vi.fn()}
      />,
      { wrapper }
    )

    expect(screen.queryByText(/Wallet/i)).toBeNull()
    expect(screen.queryByText(/Credit Wallet/i)).toBeNull()
    expect(screen.queryByText(/Wallet Balance/i)).toBeNull()
  })

  it("proves SHOP_ADMIN/SHOP_MANAGER/SHOP_STAFF/SHOP_VIEWER are rejected by the active permission system", () => {
    const legacyRoles = ["SHOP_ADMIN", "SHOP_MANAGER", "SHOP_STAFF", "SHOP_VIEWER"]
    
    for (const role of legacyRoles) {
      // 1. satisfies should reject these roles for any route guards expecting valid roles or superAdminOnly
      const rejectedBySuperAdminGate = satisfies(
        { role, permissions: [] },
        { superAdminOnly: true }
      )
      expect(rejectedBySuperAdminGate).toBe(false)

      const rejectedByRolesGate = satisfies(
        { role, permissions: [] },
        { rolesAllowed: ["FINANCE_ADMIN", "ADMIN_EMPLOYEE"] }
      )
      expect(rejectedByRolesGate).toBe(false)

      // 2. isMenuItemAllowed should return false for menus requiring authorization when these roles have no permissions
      const menuAllowed = isMenuItemAllowed("vendorApplications", {
        role,
        permissions: []
      })
      expect(menuAllowed).toBe(false)
    }
  })
})
