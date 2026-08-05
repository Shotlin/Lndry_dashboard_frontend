export type DiscountType = "PERCENTAGE" | "FLAT"

/** Who may redeem a coupon — ported from Bakaloo (see CLAUDE.md's "Bakaloo Feature Port" section). */
export type CouponTargetType = "ALL" | "SEGMENT" | "INDIVIDUAL" | "FIRST_TIME"

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
  targetType?: CouponTargetType | null
  targetSegmentId?: string | null
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
  targetType?: CouponTargetType
  targetSegmentId?: string
  targetUserIds?: string[]
}

/** Update coupon payload — all optional + isActive toggle */
export interface UpdateCouponPayload extends Partial<CreateCouponPayload> {
  isActive?: boolean
}

/** Individually-targeted customer, as returned by GET /coupons/:id/target-users */
export interface CouponTargetUser {
  id: string
  name: string | null
  phone: string | null
  email: string | null
}
