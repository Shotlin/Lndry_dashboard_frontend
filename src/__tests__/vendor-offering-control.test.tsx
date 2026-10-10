import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"

const mutate = vi.fn()
let pending = false
vi.mock("@/hooks/useVendorDetail", () => ({
  useSetVendorOffering: () => ({ mutate, isPending: pending }),
}))

// Radix Select needs browser APIs jsdom lacks; a native <select> exercises our logic, not Radix.
vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, disabled, children }: any) => (
    <select aria-label="App access" value={value} disabled={disabled} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}))

const { VendorOfferingControl, VendorOfferingBadge, OFFERING_LABEL } = await import("@/components/vendors/VendorOfferingControl")

const base = { vendorId: "v1", offering: "MARKETPLACE" as const, onboardingStatus: "NOT_STARTED" as const, planName: null, validTo: null }
const save = () => screen.getByRole("button", { name: /^save/i })

describe("VendorOfferingControl", () => {
  beforeEach(() => {
    cleanup()
    mutate.mockReset()
    pending = false
  })

  it("starts clean: Save is disabled and nothing is sent", () => {
    render(<VendorOfferingControl {...base} />)
    expect(save()).toBeDisabled()
    expect(mutate).not.toHaveBeenCalled()
  })

  it("hides the plan fields for Marketplace-only and shows them for POS / Both", () => {
    render(<VendorOfferingControl {...base} />)
    expect(screen.queryByLabelText("POS plan name")).toBeNull()
    fireEvent.change(screen.getByLabelText("App access"), { target: { value: "BOTH" } })
    expect(screen.getByLabelText("POS plan name")).toBeInTheDocument()
    expect(screen.getByLabelText("POS plan valid until")).toBeInTheDocument()
  })

  it("changing the offering asks for confirmation first, then sends exactly what was typed", () => {
    render(<VendorOfferingControl {...base} />)
    fireEvent.change(screen.getByLabelText("App access"), { target: { value: "BOTH" } })
    fireEvent.change(screen.getByLabelText("POS plan name"), { target: { value: "Enterprise 5 Store" } })
    fireEvent.change(screen.getByLabelText("POS plan valid until"), { target: { value: "2026-11-03" } })
    fireEvent.click(save())
    expect(mutate).not.toHaveBeenCalled() // waiting for the dialog
    expect(screen.getByText(/Change app access to Marketplace \+ POS\?/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Change access" }))
    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith({ offering: "BOTH", pos_plan_name: "Enterprise 5 Store", pos_valid_to: "2026-11-03" })
  })

  it("cancelling the dialog sends nothing", () => {
    render(<VendorOfferingControl {...base} />)
    fireEvent.change(screen.getByLabelText("App access"), { target: { value: "POS" } })
    fireEvent.click(save())
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(mutate).not.toHaveBeenCalled()
  })

  it("editing only the plan saves directly (no confirmation, offering unchanged)", () => {
    render(<VendorOfferingControl {...base} offering="BOTH" onboardingStatus="COMPLETED" planName="Basic" validTo="2026-01-01" />)
    fireEvent.change(screen.getByLabelText("POS plan name"), { target: { value: "Pro" } })
    fireEvent.click(save())
    expect(screen.queryByText(/Change app access to/)).toBeNull()
    expect(mutate).toHaveBeenCalledWith({ offering: "BOTH", pos_plan_name: "Pro", pos_valid_to: "2026-01-01" })
  })

  it("switching back to the original value makes the form clean again", () => {
    render(<VendorOfferingControl {...base} />)
    fireEvent.change(screen.getByLabelText("App access"), { target: { value: "POS" } })
    expect(save()).toBeEnabled()
    fireEvent.change(screen.getByLabelText("App access"), { target: { value: "MARKETPLACE" } })
    expect(save()).toBeDisabled()
  })

  it("disables everything while saving", () => {
    pending = true
    render(<VendorOfferingControl {...base} offering="BOTH" onboardingStatus="COMPLETED" />)
    expect(screen.getByLabelText("App access")).toBeDisabled()
    expect(screen.getByLabelText("POS plan name")).toBeDisabled()
    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled()
  })

  it("follows the server after a refetch", () => {
    const { rerender } = render(<VendorOfferingControl {...base} />)
    rerender(<VendorOfferingControl {...base} offering="POS" onboardingStatus="IN_PROGRESS" planName="Trial" />)
    expect((screen.getByLabelText("App access") as HTMLSelectElement).value).toBe("POS")
    expect((screen.getByLabelText("POS plan name") as HTMLInputElement).value).toBe("Trial")
    expect(screen.getByText("POS setup in progress")).toBeInTheDocument()
    expect(save()).toBeDisabled()
  })

  it("shows the setup status only for vendors that have POS", () => {
    const { rerender } = render(<VendorOfferingControl {...base} onboardingStatus="NOT_STARTED" />)
    expect(screen.queryByText(/POS setup/)).toBeNull()
    rerender(<VendorOfferingControl {...base} offering="BOTH" onboardingStatus="COMPLETED" />)
    expect(screen.getByText("POS setup complete")).toBeInTheDocument()
  })
})

describe("VendorOfferingBadge", () => {
  it("renders every offering and a dash when unknown", () => {
    for (const o of ["MARKETPLACE", "POS", "BOTH"] as const) {
      const { unmount } = render(<VendorOfferingBadge offering={o} />)
      expect(screen.getByText(OFFERING_LABEL[o].toUpperCase())).toBeInTheDocument()
      unmount()
    }
    render(<VendorOfferingBadge />)
    expect(screen.getByText("—")).toBeInTheDocument()
  })
})
