import api from "@/lib/api"
import type { ApiResponse, Banner, CreateBannerPayload, UpdateBannerPayload } from "@/types"

/** List all banners (HQ view — admin banner CRUD, not the public customer route) */
export async function getBanners() {
  const { data } = await api.get<ApiResponse<Banner[]>>("/admin/banners")
  return data.data
}

/** Get a single banner by ID */
export async function getBanner(id: string) {
  const { data } = await api.get<ApiResponse<Banner>>(`/admin/banners/${id}`)
  return data.data
}

/** Create a banner */
export async function createBanner(payload: CreateBannerPayload) {
  const { data } = await api.post<ApiResponse<Banner>>("/admin/banners", payload)
  return data.data
}

/** Update a banner */
export async function updateBanner(id: string, payload: UpdateBannerPayload) {
  const { data } = await api.put<ApiResponse<Banner>>(`/admin/banners/${id}`, payload)
  return data.data
}

/** Delete a banner */
export async function deleteBanner(id: string) {
  const { data } = await api.delete<ApiResponse<null>>(`/admin/banners/${id}`)
  return data.data
}

/** Reorder banners — body is the full ordered list of all banner IDs */
export async function reorderBanners(orderedIds: string[]) {
  const { data } = await api.put<ApiResponse<null>>("/admin/banners/reorder", { orderedIds })
  return data.data
}
