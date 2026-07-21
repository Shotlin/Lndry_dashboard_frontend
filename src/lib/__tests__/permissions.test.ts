/**
 * Unit tests for `satisfies()` — the pure RBAC guard predicate.
 *
 * Covers each guard branch (`superAdminOnly`, `rolesAllowed`, `allOf`,
 * `anyOf`) and the composite case where multiple branches combine.
 *
 * Validates: Requirements 4.1 (RBAC permission map), 4.7 (single source).
 */

import { describe, it, expect } from "vitest"

import {
  satisfies,
  type PermissionSubject,
  type Role,
  type PermissionToken,
  findRouteGuard,
  entityOf,
  primaryEntityFor,
  isMenuItemAllowed,
} from "@/lib/permissions"

function user(role: Role, permissions: PermissionToken[] = []): PermissionSubject {
  return { role, permissions }
}

describe("satisfies — superAdminOnly branch", () => {
  it("denies a standard user", () => {
    expect(satisfies(user("ADMIN_EMPLOYEE"), { superAdminOnly: true })).toBe(false)
  })

  it("allows a SUPER_ADMIN", () => {
    expect(satisfies(user("SUPER_ADMIN"), { superAdminOnly: true })).toBe(true)
  })
})

describe("satisfies — rolesAllowed branch", () => {
  it("allows role when role is permitted", () => {
    expect(
      satisfies(user("FINANCE_ADMIN"), { rolesAllowed: ["FINANCE_ADMIN"] }),
    ).toBe(true)
  })

  it("denies role when not permitted", () => {
    expect(
      satisfies(user("ADMIN_EMPLOYEE"), { rolesAllowed: ["FINANCE_ADMIN"] }),
    ).toBe(false)
  })
})

describe("satisfies — allOf branch", () => {
  it("allows when every required permission is present", () => {
    expect(
      satisfies(user("ADMIN_EMPLOYEE", ["orders.read", "payments.read"]), { allOf: ["orders.read", "payments.read"] }),
    ).toBe(true)
  })

  it("denies when any required permission is missing", () => {
    expect(satisfies(user("ADMIN_EMPLOYEE", ["orders.read"]), { allOf: ["orders.read", "payments.read"] })).toBe(
      false,
    )
  })
})

describe("satisfies — anyOf branch", () => {
  it("allows when at least one permission is present", () => {
    expect(satisfies(user("ADMIN_EMPLOYEE", ["orders.read"]), { anyOf: ["orders.read", "payments.read"] })).toBe(
      true,
    )
  })
})

describe("findRouteGuard", () => {
  it("matches /vendor-applications to the vendor applications guard", () => {
    const g = findRouteGuard("/vendor-applications")
    expect(g).not.toBeNull()
    expect(g?.anyOf).toEqual(["vendor_applications.read"])
  })

  it("returns null for unguarded paths", () => {
    expect(findRouteGuard("/dashboard")).toBeNull()
  })
})

describe("entityOf", () => {
  it("extracts the entity prefix from a permission token", () => {
    expect(entityOf("orders.read")).toBe("orders")
    expect(entityOf("activity-log.read")).toBe("activity-log")
  })
})

describe("primaryEntityFor", () => {
  it("derives the entity from anyOf when present", () => {
    expect(
      primaryEntityFor({
        pattern: /^\/x$/,
        anyOf: ["vendors.read"],
      }),
    ).toBe("vendors")
  })
})

describe("isMenuItemAllowed", () => {
  it("allows legacy items (no entry in MENU_PERMISSIONS)", () => {
    const subject = user("ADMIN_EMPLOYEE", [])
    expect(isMenuItemAllowed("legacy-item", subject)).toBe(true)
  })

  it("allows categories menu for authorized admins", () => {
    const subject = user("FINANCE_ADMIN", ["categories.read"])
    expect(isMenuItemAllowed("categories", subject)).toBe(true)
  })

  it("denies categories menu for unauthorized admins", () => {
    const subject = user("FINANCE_ADMIN", ["orders.read"])
    expect(isMenuItemAllowed("categories", subject)).toBe(false)
  })
})
