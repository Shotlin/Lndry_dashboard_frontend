import api from "@/lib/api"
import type { ApiResponse } from "@/types"

export interface Vendor {
  id: string
  name: string
  description?: string
  logo_url?: string
  banner_url?: string
  owner_name: string
  phone: string
  email: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  pincode: string
  lat: number
  lng: number
  delivery_radius_km: number
  requested_service_radius_km?: number
  approved_service_radius_km?: number
  gst_number?: string
  pan_number?: string
  bank_account_number?: string
  bank_ifsc?: string
  bank_name?: string
  bank_holder_name?: string
  status: "PENDING" | "WAITING_FOR_APPROVAL" | "APPROVED" | "REJECTED" | "CORRECTION_REQUIRED" | "SUSPENDED"
  rejection_reason?: string | null
  correction_sections?: string[] | null
  operating_hours?: any
  created_at: string
  updated_at: string
  is_active: boolean
  services_count?: number
  slots_count?: number
  max_capacity?: number
  today_orders_count?: number
  acceptance_rate?: number
}

export interface KycDocument {
  id: string
  document_type: 'owner_identity' | 'shop_photo' | 'registration_document' | 'gst_certificate'
  file_url: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejection_reason?: string
  created_at?: string
}

export interface VendorDetails extends Vendor {
  documents: KycDocument[]
}

export interface VendorListResponse {
  vendors: Vendor[]
  total: number
}

export const CORRECTION_SECTIONS = [
  { key: "business", label: "Business Details" },
  { key: "owner_bank", label: "Owner & Bank Details" },
  { key: "location", label: "Shop Location" },
  { key: "radius", label: "Service Radius" },
  { key: "documents", label: "Documents" },
] as const

export type CorrectionSectionKey = (typeof CORRECTION_SECTIONS)[number]["key"]

export interface ReviewApplicationPayload {
  status: "APPROVED" | "REJECTED" | "CORRECTION_REQUIRED" | "SUSPENDED"
  approvedRadius?: number
  rejectionReason?: string
  correctionSections?: CorrectionSectionKey[]
  documentReviews?: Array<{
    documentId: string
    status: "APPROVED" | "REJECTED"
    rejectionReason?: string
  }>
}

export async function getVendorsList(params: {
  page?: number
  limit?: number
  city?: string
  status?: string
  search?: string
}): Promise<VendorListResponse> {
  const { data } = await api.get<ApiResponse<Vendor[]>>("/vendors/admin/list", {
    params,
  })
  return {
    vendors: data.data || [],
    total: (data as any).total ?? data.data?.length ?? 0,
  }
}

export async function getVendorDetails(id: string): Promise<VendorDetails> {
  const { data } = await api.get<ApiResponse<VendorDetails>>(`/vendors/admin/${id}`)
  return data.data
}

export async function reviewVendorApplication(
  id: string,
  payload: ReviewApplicationPayload
): Promise<Vendor> {
  const { data } = await api.post<ApiResponse<Vendor>>(
    `/vendors/admin/${id}/review`,
    payload
  )
  return data.data
}

export interface UpdateApplicationDetailsPayload {
  owner_name?: string
  name?: string
  description?: string
  email?: string
  gst_number?: string
  pan_number?: string
  bank_account_number?: string
  bank_ifsc?: string
  bank_name?: string
  bank_holder_name?: string
}

// Deliberately has no `phone` field — the mobile number is copied from the
// vendor's login account and isn't editable here, by admin or vendor.
export async function updateVendorApplicationDetails(
  id: string,
  payload: UpdateApplicationDetailsPayload
): Promise<Vendor> {
  const { data } = await api.patch<ApiResponse<Vendor>>(
    `/vendors/admin/${id}`,
    payload
  )
  return data.data
}

export async function getKycDocumentBlob(documentId: string): Promise<Blob> {
  const { data } = await api.get(`/vendors/admin/documents/${documentId}/preview`, {
    responseType: "blob",
  })
  return data as unknown as Blob
}
