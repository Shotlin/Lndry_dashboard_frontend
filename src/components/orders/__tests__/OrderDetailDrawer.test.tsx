/**
 * Unit tests for the order detail drawer.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
if (typeof globalThis.ResizeObserver === "undefined") {
  ;(globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub })
    .ResizeObserver = ResizeObserverStub
}

if (
  typeof window !== "undefined" &&
  !(Element.prototype as unknown as { hasPointerCapture?: () => boolean })
    .hasPointerCapture
) {
  Object.defineProperty(Element.prototype, "hasPointerCapture", {
    value: () => false,
    configurable: true,
  })
  Object.defineProperty(Element.prototype, "releasePointerCapture", {
    value: () => undefined,
    configurable: true,
  })
}

const useOrderDetailMock = vi.fn()

vi.mock("@/hooks/useOrders", () => {
  const stub = () => ({ mutate: vi.fn(), isPending: false })
  return {
    useOrderDetail: (...args: unknown[]) => useOrderDetailMock(...args),
    useUpdateOrderStatus: stub,
    useDownloadInvoice: stub,
    useRefundOrder: stub,
    useCancelOrder: stub,
    useDownloadPackingSlip: stub,
  }
})

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} />
  },
}))

import { OrderDetailDrawer } from "@/components/orders/OrderDetailDrawer"
import type { OrderDetail } from "@/types/order.types"

function makeOrder(overrides: Partial<OrderDetail> = {}): OrderDetail {
  return {
    id: "order-1",
    order_number: "ORD-1001",
    total_amount: 1500,
    subtotal: 1400,
    delivery_fee: 100,
    tax: 0,
    discount: 0,
    status: "PENDING",
    payment_status: "PAID",
    payment_method: "ONLINE",
    notes: "Please wash carefully",
    created_at: "2024-01-01T00:00:00Z",
    customer_name: "Aarav",
    customer_email: "aarav@example.com",
    customer_phone: "+919876543210",
    items: [
      {
        id: "item-1",
        name: "Shirt",
        quantity: 2,
        price: 50,
        total: 100,
      },
    ],
    rider_id: null,
    rider_name: null,
    rider_phone: null,
    proof_photo_url: null,
    cancelled_reason: null,
    timeline: [
      {
        from_status: null,
        to_status: "PENDING",
        changed_by: null,
        note: null,
        changed_at: "2024-01-01T00:00:00Z",
      },
    ],
    payment: null,
    delivery: null,
    shop_id: "s1",
    ...overrides,
  } as unknown as OrderDetail
}

function primeOrderDetail(order: OrderDetail | undefined, isLoading = false) {
  useOrderDetailMock.mockReturnValue({
    data: order,
    isLoading,
  })
}

beforeEach(() => {
  useOrderDetailMock.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("<OrderDetailDrawer />", () => {
  it("renders the order normally", () => {
    primeOrderDetail(makeOrder())

    render(
      <OrderDetailDrawer orderId="order-1" open onClose={() => {}} />,
    )

    expect(screen.queryByText(/404 — Order not found/i)).toBeNull()
    expect(screen.getByText("Aarav")).toBeInTheDocument()
  })

  it("does not render the 404 view while the detail is still loading", () => {
    primeOrderDetail(undefined, /* isLoading */ true)

    render(
      <OrderDetailDrawer orderId="order-1" open onClose={() => {}} />,
    )

    expect(screen.queryByText(/404 — Order not found/i)).toBeNull()
  })
})
