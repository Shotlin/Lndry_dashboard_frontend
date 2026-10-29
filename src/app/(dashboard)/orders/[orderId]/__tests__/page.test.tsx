import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

const refundMutate = vi.fn()
vi.mock("next/navigation", () => ({ useParams: () => ({ orderId: "o-1" }) }))
vi.mock("next/link", () => ({ default: ({ children, href }: any) => <a href={href}>{children}</a> }))
vi.mock("@/hooks/useOrders", () => ({
  useOrderDetail: () => ({
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    data: {
      id: "o-1", order_number: "LNDR-1", status: "PENDING", created_at: "2026-10-29T10:00:00Z",
      booking_type: "ASSISTED", customer_name: "SAYAN", customer_phone: "9444400001", shop_name: "Lndry Premium store",
      rider_name: null, delivery: null, timeline: [],
      delivery_address: { line1: "12 MG Road", city: "Bengaluru" },
      items: [{ id: "i1", name: "Wash & Fold", quantity: 1, unit: "kg", price: 81, total: 81 }],
      financials: {
        total: 139, paid: 50, refunded: 0, net_paid: 50, balance_due: 89, payment_state: "PARTIALLY_PAID", is_estimate: true,
        breakdown: { subtotal: 139, discount: 0, delivery_fee: 0, platform_fee: 0, handling_fee: 0, late_night_fee: 0, tax: 0, tip: 0 },
      },
      payments: [
        { id: "p1", purpose: "ADVANCE", status: "PAID", method: "upi", amount: 50, currency: "INR", razorpay_order_id: "order_1",
          razorpay_payment_id: "pay_1", paid_at: "2026-10-29T10:01:00Z", created_at: "2026-10-29T10:00:30Z", failure_reason: null,
          refunded_amount: 0, refundable_amount: 50, refunds: [] },
        { id: "p2", purpose: "BALANCE", status: "PENDING", method: null, amount: 89, currency: "INR", razorpay_order_id: null,
          razorpay_payment_id: null, paid_at: null, created_at: "2026-10-29T10:00:40Z", failure_reason: null,
          refunded_amount: 0, refundable_amount: 0, refunds: [] },
      ],
    },
  }),
  useRefundOrderPayment: () => ({ mutate: refundMutate, isPending: false }),
}))

import OrderDetailPage from "../page"

describe("Order detail page", () => {
  it("shows what was paid, what is left, and the payment ledger", () => {
    render(<OrderDetailPage />)
    expect(screen.getByText("Paid so far").nextSibling?.textContent).toBe("₹50.00")
    expect(screen.getByText("Balance to collect").nextSibling?.textContent).toBe("₹89.00")
    expect(screen.getByText("Advance")).toBeTruthy()
    expect(screen.getByText("Wash & Fold")).toBeTruthy()
    expect(screen.getByText(/final price is confirmed/i)).toBeTruthy()
  })

  it("only offers a refund on a payment that has money to give back, and sends the typed amount", () => {
    render(<OrderDetailPage />)
    expect(screen.getAllByRole("button", { name: /refund/i })).toHaveLength(1)
    fireEvent.click(screen.getByRole("button", { name: /refund/i }))
    fireEvent.change(screen.getByLabelText(/refund amount/i), { target: { value: "20" } })
    fireEvent.click(screen.getByRole("button", { name: /refund ₹20\.00/i }))
    expect(refundMutate).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: "p1", amount: 20 }),
      expect.anything()
    )
  })
})
