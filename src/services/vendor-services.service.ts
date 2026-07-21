import api from "@/lib/api"
import type { ApiResponse } from "@/types"

export type ServiceApprovalStatus = "PENDING" | "APPROVED" | "REJECTED"

export interface VendorServiceRate {
  rate_id: string
  garment_type_id: string
  garment_name: string
  unit: string
  demo_price: number | null
  rate_paise: number
  is_active: boolean
  override_reason: string | null
  override_at: string | null
}

export interface VendorServiceForReview {
  id: string
  name: string
  description: string | null
  approval_status: ServiceApprovalStatus
  rejection_reason: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  vendor_id: string
  vendor_name: string
  category_id: string | null
  category_name: string | null
  rates: VendorServiceRate[]
}

export interface VendorServicesForReviewResponse {
  services: VendorServiceForReview[]
  total: number
  page: number
  limit: number
}

export const vendorServicesService = {
  async getForReview(status?: ServiceApprovalStatus): Promise<VendorServicesForReviewResponse> {
    const { data } = await api.get<ApiResponse<VendorServicesForReviewResponse>>(
      "/vendors/admin/services",
      { params: { status, limit: 100 } }
    )
    return data.data
  },

  async approve(serviceId: string): Promise<void> {
    await api.post(`/vendors/admin/services/${serviceId}/approve`)
  },

  async reject(serviceId: string, reason: string): Promise<void> {
    await api.post(`/vendors/admin/services/${serviceId}/reject`, { reason })
  },

  async recalculateRate(rateId: string, ratePaise: number, reason?: string): Promise<void> {
    await api.patch(`/vendors/admin/services/rates/${rateId}`, { rate_paise: ratePaise, reason })
  },
}
