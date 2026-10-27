import { describe, it, expect } from "vitest"
import { resolveRedirectTarget } from "@/lib/safe-redirect"

describe("resolveRedirectTarget — post-login redirect must stay on this site", () => {
  it("keeps ordinary in-app paths, with query and hash", () => {
    expect(resolveRedirectTarget("/orders")).toBe("/orders")
    expect(resolveRedirectTarget("/orders?status=pending&page=2#top")).toBe("/orders?status=pending&page=2#top")
  })
  it("defaults to the dashboard", () => {
    expect(resolveRedirectTarget(null)).toBe("/dashboard")
    expect(resolveRedirectTarget("")).toBe("/dashboard")
    expect(resolveRedirectTarget(undefined)).toBe("/dashboard")
  })
  it.each([
    "https://evil.example",
    "http://evil.example/x",
    "//evil.example",
    "///evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "/\\/evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "/%5Cevil.example/..//",           // decoded by some proxies; must still not leave the origin
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "orders",
  ])("refuses %j", (bad) => {
    const out = resolveRedirectTarget(bad)
    expect(out === "/dashboard" || out.startsWith("/")).toBe(true)
    expect(out.startsWith("//")).toBe(false)
    expect(out).not.toMatch(/\\|evil\.example|javascript:/i)
  })
  it("never loops back into the login screens", () => {
    expect(resolveRedirectTarget("/login")).toBe("/dashboard")
    expect(resolveRedirectTarget("/login/verify-2fa?x=1")).toBe("/dashboard")
  })
  it("rejects absurdly long values", () => {
    expect(resolveRedirectTarget(`/${"a".repeat(600)}`)).toBe("/dashboard")
  })
})
