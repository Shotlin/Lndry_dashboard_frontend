import api from "@/lib/api"
import type {
  ApiResponse,
  IncompleteOrder,
  IncompleteOrderDetail,
  IncompleteOrderSummary,
  IssueRecoveryCouponPayload,
  SendRecoveryReminderPayload,
} from "@/types"

type ListPagination = { page: number; limit: number; total: number; totalPages: number }

/**
 * List incomplete checkouts (order_drafts that never became a real order).
 * The backend controller passes `{ pagination }` (wrapped, matching
 * coupons.controller.js's pattern) to success(), which spreads it as a
 * top-level `pagination` key holding the nested object — not the flat
 * page/limit/total/totalPages keys customer-segments.service.ts adapts for.
 */
export async function getIncompleteOrders(params: { page?: number; limit?: number; search?: string } = {}) {
  const { data } = await api.get<ApiResponse<IncompleteOrder[]> & { pagination?: ListPagination }>(
    "/admin/incomplete-orders",
    { params }
  )
  return { orders: data.data, pagination: data.pagination }
}

/** Summary stats for the incomplete-orders page header */
export async function getIncompleteOrdersSummary() {
  const { data } = await api.get<ApiResponse<IncompleteOrderSummary>>("/admin/incomplete-orders/summary")
  return data.data
}

/** Full detail for one incomplete checkout */
export async function getIncompleteOrderDetail(id: string) {
  const { data } = await api.get<ApiResponse<IncompleteOrderDetail>>(`/admin/incomplete-orders/${id}`)
  return data.data
}

/** Send a recovery reminder notification to the customer */
export async function sendRecoveryReminder(id: string, payload: SendRecoveryReminderPayload) {
  const { data } = await api.post<ApiResponse<{ success: boolean; notificationId: string }>>(
    `/admin/incomplete-orders/${id}/notify`,
    payload
  )
  return data.data
}

/** Issue (create or assign) a coupon to nudge checkout completion */
export async function issueRecoveryCoupon(id: string, payload: IssueRecoveryCouponPayload) {
  const { data } = await api.post<ApiResponse<{ success: boolean; couponId: string; code?: string }>>(
    `/admin/incomplete-orders/${id}/coupon`,
    payload
  )
  return data.data
}
