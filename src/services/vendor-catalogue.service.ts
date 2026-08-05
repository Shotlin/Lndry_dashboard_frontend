import api from "@/lib/api"
import type { ApiResponse } from "@/types"

// Admin equivalents of a vendor's own self-service catalogue endpoints —
// same vendorId-first core on the backend (vendors.service.js), so shapes
// match exactly. Distinct from vendor-services.service.ts, which is the
// separate cross-vendor "services awaiting review" queue.

export interface ServiceCategory {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  sort_order?: number
}

export interface VendorCatalogueService {
  id: string
  name: string
  description?: string | null
  status: string
  is_available: boolean
  category_id: string
  category_name?: string
  price_per_piece: number
  min_weight_kg: number
  approval_status: "PENDING" | "APPROVED" | "REJECTED"
  rejection_reason?: string | null
  latest_override_reason?: string | null
  latest_override_at?: string | null
}

export interface GarmentRate {
  garment_rate_id: string
  garment_name: string
  unit: string
  rate_paise: number
  is_available: boolean
  vendor_service_id: string
  override_reason?: string | null
  override_at?: string | null
}

export interface VendorCatalogueServiceDetails {
  category: { id: string; name: string }
  service: VendorCatalogueService
  garments: GarmentRate[]
}

export async function getVendorCategories(): Promise<ServiceCategory[]> {
  const { data } = await api.get<ApiResponse<ServiceCategory[]>>("/vendor/categories")
  return data.data || []
}

export async function getVendorServicesAdmin(
  vendorId: string,
  params?: { status?: string; category_id?: string }
): Promise<{ services: VendorCatalogueService[]; total: number }> {
  const { data } = await api.get<ApiResponse<VendorCatalogueService[]>>(`/vendors/admin/${vendorId}/services`, { params })
  return { services: data.data || [], total: (data as unknown as { total?: number }).total ?? data.data?.length ?? 0 }
}

export async function createVendorServiceAdmin(
  vendorId: string,
  payload: { category_id: string; name?: string; description?: string; price_per_piece?: number; min_weight_kg?: number }
): Promise<VendorCatalogueService> {
  const { data } = await api.post<ApiResponse<VendorCatalogueService>>(`/vendors/admin/${vendorId}/services`, payload)
  return data.data
}

export async function getVendorServiceDetailsAdmin(vendorId: string, serviceId: string): Promise<VendorCatalogueServiceDetails> {
  const { data } = await api.get<ApiResponse<VendorCatalogueServiceDetails>>(`/vendors/admin/${vendorId}/services/${serviceId}`)
  return data.data
}

export async function updateVendorServiceAdmin(
  vendorId: string,
  serviceId: string,
  payload: { name?: string; description?: string; price_per_piece?: number; min_weight_kg?: number; is_available?: boolean }
): Promise<VendorCatalogueService> {
  const { data } = await api.patch<ApiResponse<VendorCatalogueService>>(`/vendors/admin/${vendorId}/services/${serviceId}`, payload)
  return data.data
}

export async function deleteVendorServiceAdmin(vendorId: string, serviceId: string): Promise<void> {
  await api.delete(`/vendors/admin/${vendorId}/services/${serviceId}`)
}

export async function addGarmentRateAdmin(
  vendorId: string,
  serviceId: string,
  payload: { garment_type_id?: string; garment_type_name?: string; rate_unit?: string; rate_paise: number }
) {
  const { data } = await api.post(`/vendors/admin/${vendorId}/services/${serviceId}/garment-rates`, payload)
  return data.data
}

export async function updateGarmentRateAdmin(
  vendorId: string,
  serviceId: string,
  garmentTypeId: string,
  payload: { rate_paise?: number; is_available?: boolean }
): Promise<void> {
  await api.patch(`/vendors/admin/${vendorId}/services/${serviceId}/garment-rates/${garmentTypeId}`, payload)
}

export async function deleteGarmentRateAdmin(vendorId: string, serviceId: string, garmentTypeId: string): Promise<void> {
  await api.delete(`/vendors/admin/${vendorId}/services/${serviceId}/garment-rates/${garmentTypeId}`)
}
