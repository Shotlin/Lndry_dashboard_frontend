/**
 * Unit tests for the customer profile drawer.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"

// The drawer's address section uses react-query internally.
const withQuery = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
)

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

const useCustomerDetailMock = vi.fn()
const useCustomerOrdersMock = vi.fn()

vi.mock("@/hooks/useCustomers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/useCustomers")>()
  const stub = () => ({ mutate: vi.fn(), isPending: false })
  return {
    ...actual,
    useCustomerDetail: (...args: unknown[]) => useCustomerDetailMock(...args),
    useCustomerOrders: (...args: unknown[]) => useCustomerOrdersMock(...args),
    useCustomerAddresses: () => ({ data: [], isLoading: false }),
    useSetDefaultAddress: stub,
    useToggleBlockCustomer: stub,
    useNotifyCustomer: stub,
  }
})

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { CustomerProfileDrawer } from "@/components/customers/CustomerProfileDrawer"
import type { CustomerDetail } from "@/types/customer.types"

function makeCustomer(overrides: Partial<CustomerDetail> = {}): CustomerDetail {
  return {
    id: "cust-1",
    name: "Riya Sharma",
    phone: "+919999999999",
    email: null,
    is_blocked: false,
    block_reason: null,
    order_count: 3,
    total_spent: 1500,
    loyalty_points: 0,
    membership_tier: "BRONZE",
    created_at: "2024-01-01T00:00:00Z",
    addresses: [],
    shop_allocations: ["s1"],
    ...overrides,
  } as unknown as CustomerDetail
}

function primeCustomerDetail(customer: CustomerDetail | undefined, isLoading = false) {
  useCustomerDetailMock.mockReturnValue({
    data: customer,
    isLoading,
  })
}

beforeEach(() => {
  useCustomerDetailMock.mockReset()
  useCustomerOrdersMock.mockReset()
  useCustomerOrdersMock.mockReturnValue({ data: { orders: [] }, isLoading: false })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("<CustomerProfileDrawer />", () => {
  it("renders the customer profile normally", () => {
    primeCustomerDetail(makeCustomer())

    render(
      <CustomerProfileDrawer
        customerId="cust-1"
        open
        onClose={() => {}}
      />,
      { wrapper: withQuery },
    )

    expect(screen.queryByText(/404 — Customer not found/i)).toBeNull()
    expect(screen.getByText("Riya Sharma")).toBeInTheDocument()
  })

  it("does not render the 404 view while loading", () => {
    primeCustomerDetail(undefined, /* isLoading */ true)

    render(
      <CustomerProfileDrawer
        customerId="cust-1"
        open
        onClose={() => {}}
      />,
      { wrapper: withQuery },
    )

    expect(screen.queryByText(/404 — Customer not found/i)).toBeNull()
  })
})
