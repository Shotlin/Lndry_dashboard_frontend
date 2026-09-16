import api from "@/lib/api"
import type {
  ApiResponse,
  ReferralProgram,
  CreateReferralProgramPayload,
  UpdateReferralProgramPayload,
} from "@/types"

/** List all referral programs (admin) */
export async function getReferralPrograms() {
  const { data } = await api.get<ApiResponse<ReferralProgram[]>>("/admin/referral-programs")
  return data.data
}

/** Create a referral program */
export async function createReferralProgram(payload: CreateReferralProgramPayload) {
  const { data } = await api.post<ApiResponse<ReferralProgram>>("/admin/referral-programs", payload)
  return data.data
}

/** Update a referral program */
export async function updateReferralProgram(id: string, payload: UpdateReferralProgramPayload) {
  const { data } = await api.put<ApiResponse<ReferralProgram>>(`/admin/referral-programs/${id}`, payload)
  return data.data
}

/** Delete a referral program */
export async function deleteReferralProgram(id: string) {
  const { data } = await api.delete<ApiResponse<null>>(`/admin/referral-programs/${id}`)
  return data.data
}
