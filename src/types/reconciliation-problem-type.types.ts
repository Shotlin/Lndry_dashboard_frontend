/** Reconciliation problem type entity — camelCase (backend formats via _format()) */
export interface ReconciliationProblemType {
  id: string
  label: string
  description: string | null
  isActive: boolean
  sortOrder: number
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

/** Create reconciliation problem type payload */
export interface CreateReconciliationProblemTypePayload {
  label: string
  description?: string
  sortOrder?: number
}

/** Update reconciliation problem type payload — all optional + isActive toggle */
export interface UpdateReconciliationProblemTypePayload extends Partial<CreateReconciliationProblemTypePayload> {
  isActive?: boolean
}
