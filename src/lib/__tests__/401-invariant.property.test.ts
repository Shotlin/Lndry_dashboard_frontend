/**
 * Property test for the 401 invariant in the axios response interceptor.
 *
 * Feature: multi-vendor-dashboard-ui, Property 3: 401 invariant
 * Validates: Requirements 1.7
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import fc from "fast-check"

import { useAuthStore } from "@/store/auth.store"
import { getQueryClient } from "@/lib/queryClient"

// Importing the module registers both interceptors on the axios instance.
import api from "@/lib/api"

type RejectedHandler = (error: unknown) => Promise<unknown>

interface InterceptorEntry {
  fulfilled: ((response: unknown) => unknown) | null
  rejected: RejectedHandler | null
}

const responseHandlers = (
  api.interceptors.response as unknown as { handlers: Array<InterceptorEntry | null> }
).handlers

const rejectedEntry = responseHandlers.find(
  (h): h is InterceptorEntry => h !== null && typeof h.rejected === "function",
)
if (!rejectedEntry || !rejectedEntry.rejected) {
  throw new Error("Response interceptor's rejected handler not registered")
}
const onRejected: RejectedHandler = rejectedEntry.rejected

interface LocationStub {
  pathname: string
  href: string
}

let locationStub: LocationStub
let originalLocation: Location

function seedAuthStore(): void {
  useAuthStore.setState({
    user: {
      id: "u1",
      role: "ADMIN_EMPLOYEE",
      email: "u1@example.com",
      name: "User One",
      permissions: [],
    } as any,
    accessToken: "token-abc",
    isAuthenticated: true,
    isHydrated: true,
  })
}

beforeEach(() => {
  originalLocation = window.location
  locationStub = { pathname: "/dashboard", href: "" }
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: locationStub,
  })

  seedAuthStore()
})

afterEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: originalLocation,
  })
  vi.restoreAllMocks()
})

describe("Property 3: 401 invariant", () => {
  it("clears auth + query client and navigates to /login for any non-auth url", async () => {
    const queryClient = getQueryClient()
    const clearSpy = vi.spyOn(queryClient, "clear")

    const urlArb = fc
      .webPath()
      .filter(
        (u) => !u.includes("/auth/me") && !u.includes("/auth/login"),
      )

    await fc.assert(
      fc.asyncProperty(urlArb, async (url) => {
        seedAuthStore()
        locationStub.pathname = "/dashboard"
        locationStub.href = ""

        const error = {
          response: {
            status: 401,
            data: {},
            headers: {},
          },
          config: { url },
          isAxiosError: true,
        }

        let propagated = false
        try {
          await onRejected(error)
        } catch {
          propagated = true
        }

        expect(propagated).toBe(true)

        expect(useAuthStore.getState().isAuthenticated).toBe(false)
        expect(useAuthStore.getState().user).toBeNull()
        expect(useAuthStore.getState().accessToken).toBeNull()

        expect(locationStub.href).toBe("/login")
      }),
      { numRuns: 50 },
    )

    expect(clearSpy).toHaveBeenCalled()
  })
})
