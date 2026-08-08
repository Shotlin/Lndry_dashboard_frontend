export type CartMilestoneRewardType = "FLAT_DISCOUNT" | "COUPON_UNLOCK"

export type CartMilestoneUserType = "ALL" | "FIRST_TIME" | "SEGMENT"

/** Cart milestone entity — camelCase (backend formats via _format()) */
export interface CartMilestone {
  id: string
  name: string
  minOrderAmount: number
  rewardType: CartMilestoneRewardType
  rewardValue: number | null
  maxDiscount: number | null
  unlockCouponId: string | null
  messageBefore: string | null
  messageAfter: string | null
  isActive: boolean
  applicableUserType: CartMilestoneUserType
  applicableSegmentId: string | null
  stackableWithCoupon: boolean
  usageLimitPerUser: number | null
  priority: number
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

/** Create cart milestone payload */
export interface CreateCartMilestonePayload {
  name: string
  minOrderAmount: number
  rewardType: CartMilestoneRewardType
  rewardValue?: number
  maxDiscount?: number
  unlockCouponId?: string
  messageBefore?: string
  messageAfter?: string
  applicableUserType?: CartMilestoneUserType
  applicableSegmentId?: string
  stackableWithCoupon?: boolean
  usageLimitPerUser?: number
  priority?: number
}

/** Update cart milestone payload — all optional + isActive toggle */
export interface UpdateCartMilestonePayload extends Partial<CreateCartMilestonePayload> {
  isActive?: boolean
}
