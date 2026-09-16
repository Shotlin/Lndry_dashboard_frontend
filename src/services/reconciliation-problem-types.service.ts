import api from "@/lib/api"
import type {
  ApiResponse,
  ReconciliationProblemType,
  CreateReconciliationProblemTypePayload,
  UpdateReconciliationProblemTypePayload,
} from "@/types"

/** List all reconciliation problem types (admin) */
export async function getReconciliationProblemTypes() {
  const { data } = await api.get<ApiResponse<ReconciliationProblemType[]>>("/admin/reconciliation-problem-types")
  return data.data
}

/** Create a reconciliation problem type */
export async function createReconciliationProblemType(payload: CreateReconciliationProblemTypePayload) {
  const { data } = await api.post<ApiResponse<ReconciliationProblemType>>("/admin/reconciliation-problem-types", payload)
  return data.data
}

/** Update a reconciliation problem type */
export async function updateReconciliationProblemType(id: string, payload: UpdateReconciliationProblemTypePayload) {
  const { data } = await api.put<ApiResponse<ReconciliationProblemType>>(`/admin/reconciliation-problem-types/${id}`, payload)
  return data.data
}

/** Delete a reconciliation problem type */
export async function deleteReconciliationProblemType(id: string) {
  const { data } = await api.delete<ApiResponse<null>>(`/admin/reconciliation-problem-types/${id}`)
  return data.data
}
