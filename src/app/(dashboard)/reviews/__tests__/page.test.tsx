/**
 * Unit tests for the reviews page.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

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

const useProductReviewsMock = vi.fn()
const useProductsMock = vi.fn()

vi.mock("@/hooks/useReviews", () => {
  const stub = () => ({ mutate: vi.fn(), isPending: false })
  return {
    useProductReviews: (...args: unknown[]) =>
      useProductReviewsMock(...args),
    useReplyReview: stub,
    useModerateReview: stub,
    useDeleteReview: stub,
  }
})

vi.mock("@/hooks/useProducts", () => ({
  useProducts: (...args: unknown[]) => useProductsMock(...args),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import ReviewsPage from "@/app/(dashboard)/reviews/page"
import type { Review } from "@/types/review.types"
import type { Product } from "@/types/product.types"

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p-1",
    name: "Sample product",
    slug: "sample-product",
    description: null,
    category_id: "cat-1",
    price: 100,
    isActive: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as Product
}

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: "r-1",
    product_id: "p-1",
    rating: 5,
    comment: "Great product",
    created_at: "2024-01-01T00:00:00Z",
    customer: {
      name: "Alice",
    },
    replies: [],
    shop_id: "s1",
    ...overrides,
  } as Review
}

function primeProducts(products: Product[]) {
  useProductsMock.mockReturnValue({
    data: { products },
    isLoading: false,
  })
}

function primeReviews(reviews: Review[]) {
  useProductReviewsMock.mockReturnValue({
    data: {
      reviews,
      averageRating: 5,
      pagination: { page: 1, limit: 10, total: reviews.length, totalPages: 1 },
    },
    isLoading: false,
  })
}

function selectProduct(name: string) {
  const item = screen.getByRole("button", { name: new RegExp(name, "i") })
  fireEvent.click(item)
}

beforeEach(() => {
  useProductReviewsMock.mockReset()
  useProductsMock.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("ReviewsPage", () => {
  it("renders the reviews list normally when product is selected", () => {
    primeProducts([makeProduct({ id: "p-1", name: "In-shop product" })])
    primeReviews([makeReview({ shop_id: "s1" })])

    render(<ReviewsPage />)

    selectProduct("In-shop product")

    expect(screen.queryByText(/404 — Reviews not found/i)).toBeNull()
    expect(screen.getByText("Great product")).toBeInTheDocument()
  })

  it("does not render the 404 view before any product is selected", () => {
    primeProducts([makeProduct({ id: "p-1", name: "Out-of-shop product" })])
    primeReviews([])

    render(<ReviewsPage />)

    expect(screen.queryByText(/404 — Reviews not found/i)).toBeNull()
    expect(
      screen.getByRole("heading", { name: /Select a product/i }),
    ).toBeInTheDocument()
  })
})
