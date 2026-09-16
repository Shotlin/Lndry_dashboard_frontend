export type ReferralRewardType =
  | "WALLET_CREDIT"
  | "FREE_EXPRESS_DELIVERY"
  | "FREE_STANDARD_DELIVERY"
  | "COUPON_UNLOCK"

export type ReferralTriggerType = "ON_SIGNUP" | "ON_FIRST_ORDER_COMPLETE"

export type ReferralProgramTargetType = "ALL" | "SEGMENT"

/** Referral program entity — camelCase (backend formats via _format()) */
export interface ReferralProgram {
  id: string
  name: string
  isActive: boolean
  targetType: ReferralProgramTargetType
  targetSegmentId: string | null
  priority: number
  validFrom: string | null
  validUntil: string | null
  referrerRewardType: ReferralRewardType
  referrerRewardAmount: number | null
  referrerRewardCount: number | null
  referrerUnlockCouponId: string | null
  referrerTrigger: ReferralTriggerType
  refereeRewardType: ReferralRewardType
  refereeRewardAmount: number | null
  refereeRewardCount: number | null
  refereeUnlockCouponId: string | null
  refereeTrigger: ReferralTriggerType
  maxReferralsPerReferrer: number | null
  termsText: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

/** Create referral program payload */
export interface CreateReferralProgramPayload {
  name: string
  isActive?: boolean
  targetType?: ReferralProgramTargetType
  targetSegmentId?: string
  priority?: number
  validFrom?: string
  validUntil?: string
  maxReferralsPerReferrer?: number
  termsText?: string
  referrerRewardType: ReferralRewardType
  referrerRewardAmount?: number
  referrerRewardCount?: number
  referrerUnlockCouponId?: string
  referrerTrigger?: ReferralTriggerType
  refereeRewardType: ReferralRewardType
  refereeRewardAmount?: number
  refereeRewardCount?: number
  refereeUnlockCouponId?: string
  refereeTrigger?: ReferralTriggerType
}

/** Update referral program payload — all optional */
export type UpdateReferralProgramPayload = Partial<CreateReferralProgramPayload>
