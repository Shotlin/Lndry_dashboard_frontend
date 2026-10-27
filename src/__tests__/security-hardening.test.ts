import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { proxy as middleware } from "@/proxy"
import { safeExternalUrl } from "@/lib/safe-url"

const req = (path: string, cookies: Record<string, string> = {}) =>
  new NextRequest(`https://dash.example.com${path}`, {
    headers: { cookie: Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ") },
  })

describe("safeExternalUrl — links built from other people's URLs", () => {
  it("passes normal web links through", () => {
    expect(safeExternalUrl("https://res.cloudinary.com/x/a.jpg")).toBe("https://res.cloudinary.com/x/a.jpg")
    expect(safeExternalUrl(" http://example.com/a b ")).toBe("http://example.com/a%20b")
  })
  it("refuses script and data URLs", () => {
    expect(safeExternalUrl("javascript:alert(document.cookie)")).toBeUndefined()
    expect(safeExternalUrl("JaVaScRiPt:alert(1)")).toBeUndefined()
    expect(safeExternalUrl("data:text/html,<script>alert(1)</script>")).toBeUndefined()
    expect(safeExternalUrl("vbscript:x")).toBeUndefined()
    expect(safeExternalUrl("//evil.example/x")).toBeUndefined()
  })
  it("refuses empty, relative, non-string and oversized input", () => {
    expect(safeExternalUrl("")).toBeUndefined()
    expect(safeExternalUrl(null)).toBeUndefined()
    expect(safeExternalUrl(undefined)).toBeUndefined()
    expect(safeExternalUrl("/admin")).toBeUndefined()
    expect(safeExternalUrl(`https://a.example/${"x".repeat(3000)}`)).toBeUndefined()
  })
})

describe("middleware", () => {
  it("refuses the disabled image-optimizer endpoint (critical Next.js advisories)", async () => {
    const res = middleware(req("/_next/image?url=%2Fx.svg&w=64&q=75", { auth_session: "1" }))
    expect(res.status).toBe(404)
  })
  it("sends signed-out visitors to /login and remembers where they were going", () => {
    const res = middleware(req("/orders"))
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/login?redirect=%2Forders")
  })
  it("lets the login page render when signed out", () => {
    expect(middleware(req("/login")).headers.get("location")).toBeNull()
  })
  it("keeps a half-logged-in (2FA pending) session on the 2FA screen", () => {
    const res = middleware(req("/orders", { auth_session: "1", mfa_pending: "1" }))
    expect(res.headers.get("location")).toContain("/login/verify-2fa")
  })
  it("forces a password change before anything else", () => {
    const res = middleware(req("/orders", { auth_session: "1", password_change_required: "1" }))
    expect(res.headers.get("location")).toContain("/change-password")
  })
})

describe("authenticator 2FA UI is removed", () => {
  it("login and settings pages no longer mention authenticator/TOTP/second factor", async () => {
    const { readFileSync } = await import("node:fs");
    const files = ["src/app/(auth)/login/page.tsx", "src/app/(dashboard)/settings/page.tsx"];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      expect(src, f).not.toMatch(/authenticator|TOTP|second factor|Set Up 2FA|JBSWY3DPEHPK3PXP/i);
    }
  });
});
