export type FirstTimeOfferRewardType =
  | "FREE_DELIVERY"
  | "FLAT_DISCOUNT"
  | "PERCENTAGE_DISCOUNT"
  | "COUPON_UNLOCK"

/** First-time offer entity — camelCase (backend formats via _format()) */
export interface FirstTimeOffer {
  id: string
  name: string
  minOrderAmount: number
  rewardType: FirstTimeOfferRewardType
  rewardValue: number | null
  maxDiscount: number | null
  unlockCouponId: string | null
  startAt: string | null
  endAt: string | null
  isActive: boolean
  autoApply: boolean
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

/** Create first-time offer payload */
export interface CreateFirstTimeOfferPayload {
  name: string
  minOrderAmount?: number
  rewardType: FirstTimeOfferRewardType
  rewardValue?: number
  maxDiscount?: number
  unlockCouponId?: string
  startAt?: string
  endAt?: string
  autoApply?: boolean
}

/** Update first-time offer payload — all optional + isActive toggle */
export interface UpdateFirstTimeOfferPayload extends Partial<CreateFirstTimeOfferPayload> {
  isActive?: boolean
}
