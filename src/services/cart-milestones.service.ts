import api from "@/lib/api"
import type {
  ApiResponse,
  CartMilestone,
  CreateCartMilestonePayload,
  UpdateCartMilestonePayload,
} from "@/types"

/** List all cart milestones (admin) */
export async function getCartMilestones() {
  const { data } = await api.get<ApiResponse<CartMilestone[]>>("/admin/cart-milestones")
  return data.data
}

/** Create a cart milestone */
export async function createCartMilestone(payload: CreateCartMilestonePayload) {
  const { data } = await api.post<ApiResponse<CartMilestone>>("/admin/cart-milestones", payload)
  return data.data
}

/** Update a cart milestone */
export async function updateCartMilestone(id: string, payload: UpdateCartMilestonePayload) {
  const { data } = await api.put<ApiResponse<CartMilestone>>(`/admin/cart-milestones/${id}`, payload)
  return data.data
}

/** Delete a cart milestone */
export async function deleteCartMilestone(id: string) {
  const { data } = await api.delete<ApiResponse<null>>(`/admin/cart-milestones/${id}`)
  return data.data
}
