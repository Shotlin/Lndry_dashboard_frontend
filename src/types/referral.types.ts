export type ReferralStatus = "PENDING_FIRST_ORDER" | "COMPLETED"

export type ReferralRewardStatus = "NOT_APPLICABLE" | "PENDING" | "GRANTED" | "FAILED"

/** Platform-wide stat strip data for the admin /referrals monitoring page. */
export interface ReferralAdminSummary {
  total: number
  pending: number
  completed: number
  rewardsGranted: number
}

/** One row of the admin /referrals monitoring table. */
export interface ReferralAdminRow {
  id: string
  status: ReferralStatus
  referrerName: string | null
  referrerPhone: string | null
  refereeName: string | null
  refereePhone: string | null
  programName: string | null
  referrerRewardStatus: ReferralRewardStatus
  referrerRewardGrantedAt: string | null
  refereeRewardStatus: ReferralRewardStatus
  refereeRewardGrantedAt: string | null
  createdAt: string
  refereeSignedUpAt: string
  refereeFirstOrderCompletedAt: string | null
}
