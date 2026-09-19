export type AccountDeletionStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED"

/** One customer "Delete Account" request, as the admin sees it. */
export interface AccountDeletionRequest {
  id: string
  userId: string
  status: AccountDeletionStatus
  reason: string | null
  requestedAt: string
  reviewedAt: string | null
  reviewNote: string | null
  reviewedByName: string | null
  /** Approval date + 30 days — when personal data is permanently wiped. */
  scheduledDeletionAt: string | null
  completedAt: string | null
  /** Snapshot taken at request time; scrubbed once status is COMPLETED. */
  customerName: string | null
  customerPhone: string | null
  walletBalance: number
  /** Orders still in progress — approval is refused while this is > 0. */
  activeOrderCount: number
}

export type AccountDeletionCounts = Record<AccountDeletionStatus, number>
