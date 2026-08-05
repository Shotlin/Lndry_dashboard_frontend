/** Incomplete checkout (order_drafts row that never became a real order) — list row */
export interface IncompleteOrder {
  id: string
  userId: string
  userName: string | null
  userPhone: string | null
  vendorId: string
  vendorName: string | null
  payableAmountPaise: number
  createdAt: string
  paymentId: string | null
  paymentStatus: string | null
  paymentExpiresAt: string | null
  reminderCount: number
  lastReminderSentAt: string | null
}

export interface IncompleteOrderSummary {
  incompleteCount: number
  incompleteValuePaise: number
  recoveredToday: number
}

export interface IncompleteOrderEvent {
  eventType: "REMINDER_SENT" | "COUPON_ISSUED"
  actorId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface IncompleteOrderCouponIssued {
  id: string
  couponId: string | null
  code: string | null
  actorId: string | null
  createdAt: string
}

export interface GarmentLine {
  name: string
  quantity: number
  unit: string
  rate_paise: number
  total_paise: number
}

/** Full detail view */
export interface IncompleteOrderDetail {
  id: string
  createdAt: string
  payableAmountPaise: number
  estimatedWeight: number | null
  garmentLines: GarmentLine[]
  user: { id: string; name: string | null; phone: string | null; email: string | null }
  vendor: { id: string; name: string | null }
  payment: { id: string; status: string; expiresAt: string | null; amount: number | null } | null
  events: IncompleteOrderEvent[]
  couponsIssued: IncompleteOrderCouponIssued[]
}

export interface SendRecoveryReminderPayload {
  title: string
  body: string
}

export interface IssueRecoveryCouponPayload {
  couponId?: string
  code?: string
  description?: string
  discountType?: "PERCENTAGE" | "FLAT"
  discountValue?: number
  minOrderAmount?: number
  maxDiscount?: number
  validUntil?: string
}
