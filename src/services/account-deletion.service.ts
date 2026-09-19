import api from "@/lib/api"
import type {
  ApiResponse,
  AccountDeletionRequest,
  AccountDeletionStatus,
  AccountDeletionCounts,
} from "@/types"

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AccountDeletionListParams {
  status?: AccountDeletionStatus
  search?: string
  page?: number
  limit?: number
}

/** Paginated deletion requests (admin) — pending ones first. */
export async function getAccountDeletionRequests(params: AccountDeletionListParams) {
  const { data: body } = await api.get<
    ApiResponse<AccountDeletionRequest[]> & {
      pagination: Pagination
      counts: AccountDeletionCounts
    }
  >("/admin/account-deletion-requests", { params })
  return { requests: body.data, pagination: body.pagination, counts: body.counts }
}

/** Approve: deactivates the account now and starts the 30-day deletion period. */
export async function approveAccountDeletion(id: string, note?: string) {
  const { data } = await api.post<ApiResponse<AccountDeletionRequest>>(
    `/admin/account-deletion-requests/${id}/approve`,
    { note: note || undefined }
  )
  return data.data
}

/** Reject: the customer's account stays active. */
export async function rejectAccountDeletion(id: string, note?: string) {
  const { data } = await api.post<ApiResponse<AccountDeletionRequest>>(
    `/admin/account-deletion-requests/${id}/reject`,
    { note: note || undefined }
  )
  return data.data
}
