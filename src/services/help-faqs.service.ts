import api from "@/lib/api"
import type {
  ApiResponse,
  HelpFaq,
  CreateHelpFaqPayload,
  UpdateHelpFaqPayload,
} from "@/types"

/** All FAQs, including disabled ones (admin). */
export async function getHelpFaqs() {
  const { data } = await api.get<ApiResponse<HelpFaq[]>>("/admin/help-faqs")
  return data.data
}

export async function createHelpFaq(payload: CreateHelpFaqPayload) {
  const { data } = await api.post<ApiResponse<HelpFaq>>("/admin/help-faqs", payload)
  return data.data
}

export async function updateHelpFaq(id: string, payload: UpdateHelpFaqPayload) {
  const { data } = await api.put<ApiResponse<HelpFaq>>(`/admin/help-faqs/${id}`, payload)
  return data.data
}

export async function deleteHelpFaq(id: string) {
  const { data } = await api.delete<ApiResponse<null>>(`/admin/help-faqs/${id}`)
  return data.data
}
