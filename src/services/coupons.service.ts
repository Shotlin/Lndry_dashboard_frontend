import api from "@/lib/api"
import type { ApiResponse, Coupon, CreateCouponPayload, UpdateCouponPayload } from "@/types"

/** List all coupons (platform-wide, HQ view) */
export async function getCoupons() {
  const { data } = await api.get<ApiResponse<Coupon[]>>("/coupons")
  return data.data
}

/** Create a coupon — always platform-wide (HQ-issued) from this dashboard page */
export async function createCoupon(payload: CreateCouponPayload) {
  const { data } = await api.post<ApiResponse<Coupon>>("/coupons", {
    ...payload,
    couponType: "PLATFORM_COUPON",
    absorber: "PLATFORM",
  })
  return data.data
}

/** Update a coupon */
export async function updateCoupon(id: string, payload: UpdateCouponPayload) {
  const { data } = await api.put<ApiResponse<Coupon>>(`/coupons/${id}`, payload)
  return data.data
}

/** Delete a coupon */
export async function deleteCoupon(id: string) {
  const { data } = await api.delete<ApiResponse<null>>(`/coupons/${id}`)
  return data.data
}
