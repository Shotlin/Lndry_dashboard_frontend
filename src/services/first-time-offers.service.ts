import api from "@/lib/api"
import type {
  ApiResponse,
  CreateFirstTimeOfferPayload,
  FirstTimeOffer,
  UpdateFirstTimeOfferPayload,
} from "@/types"

/** List all first-time offers (admin) */
export async function getFirstTimeOffers() {
  const { data } = await api.get<ApiResponse<FirstTimeOffer[]>>("/admin/first-time-offers")
  return data.data
}

/** Create a first-time offer */
export async function createFirstTimeOffer(payload: CreateFirstTimeOfferPayload) {
  const { data } = await api.post<ApiResponse<FirstTimeOffer>>("/admin/first-time-offers", payload)
  return data.data
}

/** Update a first-time offer */
export async function updateFirstTimeOffer(id: string, payload: UpdateFirstTimeOfferPayload) {
  const { data } = await api.put<ApiResponse<FirstTimeOffer>>(`/admin/first-time-offers/${id}`, payload)
  return data.data
}

/** Delete a first-time offer */
export async function deleteFirstTimeOffer(id: string) {
  const { data } = await api.delete<ApiResponse<null>>(`/admin/first-time-offers/${id}`)
  return data.data
}
