import api from "@/lib/api"
import type { ApiResponse, ReferralAdminRow, ReferralAdminSummary } from "@/types"

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

/** Platform-wide referral stats for the admin monitoring page's stat strip. */
export async function getReferralsSummary() {
  const { data } = await api.get<ApiResponse<ReferralAdminSummary>>("/admin/referrals/summary")
  return data.data
}

/** Platform-wide, paginated, searchable referral list (admin). */
export async function getReferrals(params: { search?: string; page?: number; limit?: number }) {
  const { data: body } = await api.get<ApiResponse<ReferralAdminRow[]> & { pagination: Pagination }>(
    "/admin/referrals",
    { params }
  )
  return { referrals: body.data, pagination: body.pagination }
}
