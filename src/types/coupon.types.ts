export type DiscountType = "PERCENTAGE" | "FLAT"

/** Coupon entity — camelCase (backend formats via _format()) */
export interface Coupon {
  id: string
  code: string
  description: string | null
  discountType: DiscountType
  discountValue: number
  minOrderAmount: number
  maxDiscount: number | null
  usageLimit: number | null
  usedCount: number
  perUserLimit: number
  validFrom: string | null
  validUntil: string | null
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

/** Coupon list filters */
export interface CouponFilters {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean | null
}

/** Create coupon payload */
export interface CreateCouponPayload {
  code: string
  description?: string
  discountType: DiscountType
  discountValue: number
  minOrderAmount?: number
  maxDiscount?: number
  usageLimit?: number
  perUserLimit?: number
  validFrom?: string
  validUntil?: string
}

/** Update coupon payload — all optional + isActive toggle */
export interface UpdateCouponPayload extends Partial<CreateCouponPayload> {
  isActive?: boolean
}
