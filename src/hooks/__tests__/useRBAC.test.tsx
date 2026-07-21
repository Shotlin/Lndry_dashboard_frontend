/**
 * Unit tests for the route + menu RBAC hooks.
 *
 * Covers:
 *   - `useRouteRBAC(pattern)` — `isAuthorized`, `canRead`, `canWrite` against
 *     the registered `ROUTE_GUARDS`
 *   - `useMenuRBAC(itemId)` — single-item lookup.
 *   - `useMenuVisibility(ids[])` — batched lookup used by the sidebar.
 *
 * Validates: Requirements 4.1, 4.2, 4.5, 4.6, 4.7.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook } from "@testing-library/react"

import {
  useMenuRBAC,
  useMenuVisibility,
  useRouteRBAC,
} from "@/hooks/useRBAC"
import { useAuthStore } from "@/store/auth.store"
import type { AdminUser } from "@/types"

function makeMockStorage() {
  const map = new Map<string, string>()
  return {
    getItem: vi.fn((k: string) => (map.has(k) ? (map.get(k) as string) : null)),
    setItem: vi.fn((k: string, v: string) => {
      map.set(k, v)
    }),
    removeItem: vi.fn((k: string) => {
      map.delete(k)
    }),
    clear: vi.fn(() => {
      map.clear()
    }),
    key: vi.fn((i: number) => Array.from(map.keys())[i] ?? null),
    get length() {
      return map.size
    },
  }
}

type TestUser = Omit<Partial<AdminUser>, "role"> & { role?: string }

function setUser(user: TestUser | null) {
  useAuthStore.setState({
    user: user
      ? ({
          id: "u1",
          name: "Tester",
          email: "tester@example.com",
          phone: "+10",
          role: user.role,
          permissions: user.permissions,
        } as unknown as AdminUser)
      : null,
    accessToken: user ? "token" : null,
    isAuthenticated: !!user,
    isHydrated: true,
  })
}

beforeEach(() => {
  vi.stubGlobal("localStorage", makeMockStorage())
  setUser(null)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("useRouteRBAC", () => {
  it("authorizes a user with vendor_applications.read for /vendor-applications", () => {
    setUser({ role: "FINANCE_ADMIN", permissions: ["vendor_applications.read"] })

    const { result } = renderHook(() => useRouteRBAC("/vendor-applications"))
    expect(result.current.isAuthorized).toBe(true)
    expect(result.current.canRead).toBe(true)
    expect(result.current.canWrite).toBe(false)
  })

  it("returns isAuthorized=true for unguarded paths", () => {
    setUser({ role: "ADMIN_EMPLOYEE", permissions: [] })
    const { result } = renderHook(() => useRouteRBAC("/dashboard"))
    expect(result.current.isAuthorized).toBe(true)
    expect(result.current.guard).toBeNull()
  })
})

describe("useMenuRBAC", () => {
  it("returns true for legacy items not in MENU_PERMISSIONS", () => {
    setUser({ role: "ADMIN_EMPLOYEE", permissions: [] })
    const { result } = renderHook(() => useMenuRBAC("legacy-orders"))
    expect(result.current).toBe(true)
  })

  it("shows vendorApplications for authorized user", () => {
    setUser({ role: "FINANCE_ADMIN", permissions: ["vendor_applications.read"] })
    const { result } = renderHook(() => useMenuRBAC("vendorApplications"))
    expect(result.current).toBe(true)
  })
})

describe("useMenuVisibility", () => {
  it("returns visibility flags keyed by id", () => {
    setUser({
      role: "SUPER_ADMIN",
      permissions: ["vendor_applications.read", "customers.read"],
    })

    const { result } = renderHook(() =>
      useMenuVisibility(["vendorApplications", "customers", "team"]),
    )
    expect(result.current.vendorApplications).toBe(true)
    expect(result.current.customers).toBe(true)
    expect(result.current.team).toBe(false)
  })
})
