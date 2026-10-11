import { describe, it, expect, vi, beforeEach } from "vitest"

const put = vi.fn()
vi.mock("@/lib/api", () => ({ default: { put: (...a: unknown[]) => put(...a) } }))

const { adminSetVendorOffering } = await import("@/services/vendors.service")

describe("adminSetVendorOffering", () => {
  beforeEach(() => {
    put.mockReset()
    put.mockResolvedValue({ data: { data: { offering: "BOTH", pos_onboarding_status: "NOT_STARTED", pos_plan_name: null, pos_valid_to: null, allowed_modes: ["MARKETPLACE"] } } })
  })

  it("PUTs to the admin offering endpoint with trimmed values", async () => {
    await adminSetVendorOffering("abc", { offering: "BOTH", pos_plan_name: "  Enterprise 5 Store ", pos_valid_to: " 2026-11-03 " })
    expect(put).toHaveBeenCalledWith("/vendors/admin/abc/offering", { offering: "BOTH", pos_plan_name: "Enterprise 5 Store", pos_valid_to: "2026-11-03" })
  })

  it("turns blank / whitespace / missing plan fields into null so the backend clears them", async () => {
    await adminSetVendorOffering("abc", { offering: "POS", pos_plan_name: "   ", pos_valid_to: "" })
    expect(put).toHaveBeenLastCalledWith("/vendors/admin/abc/offering", { offering: "POS", pos_plan_name: null, pos_valid_to: null })
    await adminSetVendorOffering("abc", { offering: "MARKETPLACE" })
    expect(put).toHaveBeenLastCalledWith("/vendors/admin/abc/offering", { offering: "MARKETPLACE", pos_plan_name: null, pos_valid_to: null })
  })

  it("returns the unwrapped payload and lets API errors propagate", async () => {
    const res = await adminSetVendorOffering("abc", { offering: "BOTH" })
    expect(res.allowed_modes).toEqual(["MARKETPLACE"])
    put.mockRejectedValueOnce(new Error("offering must be one of MARKETPLACE, POS, BOTH"))
    await expect(adminSetVendorOffering("abc", { offering: "BOTH" })).rejects.toThrow(/offering must be/)
  })
})
