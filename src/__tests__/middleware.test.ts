/**
 * Unit tests for `src/middleware.ts` — auth gate.
 *
 * Validates: Requirements 1.6, 1.7 (preserve).
 */

import { describe, expect, it } from "vitest"
import { NextRequest } from "next/server"

import { middleware } from "@/middleware"

interface MakeRequestOpts {
  pathname: string
  /** Cookie map. `undefined` keys are skipped. */
  cookies?: Record<string, string | undefined>
}

function makeRequest({ pathname, cookies = {} }: MakeRequestOpts): NextRequest {
  const url = `https://example.test${pathname}`
  const cookieHeader = Object.entries(cookies)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v as string}`)
    .join("; ")
  return new NextRequest(url, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  })
}

describe("middleware — unauthenticated", () => {
  it("redirects to /login when no auth_session cookie is present", () => {
    const req = makeRequest({ pathname: "/dashboard" })
    const res = middleware(req)

    expect(res.status).toBe(307) // Next.js redirect
    const location = res.headers.get("location")
    expect(location).not.toBeNull()
    const url = new URL(location as string)
    expect(url.pathname).toBe("/login")
    expect(url.searchParams.get("redirect")).toBe("/dashboard")
  })

  it("allows access to /login when no auth_session cookie is present", () => {
    const req = makeRequest({ pathname: "/login" })
    const res = middleware(req)

    expect(res.status).toBe(200)
    expect(res.headers.get("location")).toBeNull()
  })

  it("skips Next.js internals and API routes regardless of auth", () => {
    for (const pathname of ["/_next/static/foo.js", "/api/v1/health"]) {
      const res = middleware(makeRequest({ pathname }))
      expect(res.status).toBe(200)
      expect(res.headers.get("location")).toBeNull()
    }
  })
})

describe("middleware — authenticated platform admin", () => {
  it("allows any route when auth_session is present", () => {
    for (const pathname of [
      "/dashboard",
      "/orders",
      "/customers",
      "/reports",
    ]) {
      const res = middleware(
        makeRequest({
          pathname,
          cookies: { auth_session: "1" },
        }),
      )
      expect(res.status).toBe(200)
      expect(res.headers.get("location")).toBeNull()
    }
  })
})
