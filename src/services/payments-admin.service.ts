import api from "@/lib/api"
import type { ApiResponse } from "@/types/api.types"

interface PaymentsPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

/** Payment record — snake_case row from GET /admin/payments (joined with orders + users) */
export interface PaymentRecord {
  id: string
  order_id: string | null
  user_id: string
  order_draft_id: string | null
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  amount: string
  currency: string
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED"
  method: string | null
  refund_id: string | null
  refund_amount: string | null
  refund_status: string | null
  created_at: string
  updated_at: string
  customer_name: string | null
  customer_phone: string | null
  order_number: string | null
}

export interface PaymentFilters {
  page?: number
  limit?: number
  status?: PaymentRecord["status"]
  search?: string
  startDate?: string
  endDate?: string
}

export async function getPayments(
  filters: PaymentFilters = {}
): Promise<{ payments: PaymentRecord[]; pagination: PaymentsPagination }> {
  const params: Record<string, unknown> = {}
  if (filters.page) params.page = filters.page
  if (filters.limit) params.limit = filters.limit
  if (filters.status) params.status = filters.status
  if (filters.search) params.search = filters.search
  if (filters.startDate) params.startDate = filters.startDate
  if (filters.endDate) params.endDate = filters.endDate

  const { data } = await api.get<
    ApiResponse<{ payments: PaymentRecord[]; pagination: PaymentsPagination }>
  >("/admin/payments", { params })
  return data.data
}

export async function issuePaymentRefund(
  paymentId: string,
  payload: { amount?: number; reason?: string } = {}
): Promise<PaymentRecord> {
  const { data } = await api.post<ApiResponse<PaymentRecord>>(
    `/payments/${paymentId}/refund`,
    payload
  )
  return data.data
}
