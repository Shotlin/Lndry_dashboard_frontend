import api from "@/lib/api"
import type { ApiResponse } from "@/types"

/** How much of the LNDRY ecosystem a vendor's POS is connected to. */
export type VendorType = "STANDARD" | "PARTNER" | "EXCLUSIVE"
/** Which LNDRY products the vendor may use in the Vendor App. A different axis from VendorType. */
export type VendorOffering = "MARKETPLACE" | "POS" | "BOTH"
export type PosOnboardingStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"

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
  requested_daily_capacity?: number | null
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
  express_pickup_available?: boolean
  vendor_type?: VendorType
  offering?: VendorOffering
  pos_onboarding_status?: PosOnboardingStatus
  pos_plan_name?: string | null
  /** YYYY-MM-DD */
  pos_valid_to?: string | null
  /** Optional Google Business Profile connection — undefined/null on every vendor that hasn't linked one. */
  google_business_url?: string | null
  google_rating?: number | string | null
  google_review_count?: number | null
  google_business_name?: string | null
}

export interface KycDocument {
  id: string
  document_type: 'owner_identity' | 'shop_photo' | 'registration_document' | 'gst_certificate' | 'service_list'
  file_url: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejection_reason?: string
  created_at?: string
}

export interface CapacityRequest {
  id: string
  vendor_id: string
  requested_daily_limit: number
  current_daily_limit_snapshot?: number | null
  status: "PENDING" | "APPROVED" | "REJECTED"
  admin_note?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  created_at: string
  vendor_name?: string
  branch_code?: string
}

export interface VendorCapacity {
  stage: "application" | "vendor"
  requested_daily_capacity?: number | null
  daily_limit?: number | null
  weekly_availability?: Array<{
    id: string
    day_of_week: number
    start_time: string
    end_time: string
    max_orders: number
    is_active: boolean
  }>
  exceptions?: Array<{ id: string; date: string; type: string; limit_count: number | null; reason: string | null }>
  requests?: CapacityRequest[]
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
  { key: "radius", label: "Service Radius & Capacity" },
  { key: "documents", label: "Documents" },
] as const

export type CorrectionSectionKey = (typeof CORRECTION_SECTIONS)[number]["key"]

export interface ReviewApplicationPayload {
  status: "APPROVED" | "REJECTED" | "CORRECTION_REQUIRED" | "SUSPENDED"
  approvedRadius?: number
  approvedDailyCapacity?: number
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

export async function getVendorCapacity(id: string): Promise<VendorCapacity> {
  const { data } = await api.get<ApiResponse<VendorCapacity>>(`/vendors/admin/${id}/capacity`)
  return data.data
}

export async function listCapacityRequests(
  status: "PENDING" | "APPROVED" | "REJECTED" = "PENDING"
): Promise<CapacityRequest[]> {
  const { data } = await api.get<ApiResponse<CapacityRequest[]>>("/vendors/admin/capacity-requests", {
    params: { status },
  })
  return data.data || []
}

export async function reviewCapacityRequest(
  requestId: string,
  payload: { status: "APPROVED" | "REJECTED"; adminNote?: string }
): Promise<CapacityRequest> {
  const action = payload.status === "APPROVED" ? "approve" : "reject"
  const { data } = await api.post<ApiResponse<CapacityRequest>>(
    `/vendors/admin/capacity-requests/${requestId}/${action}`,
    { adminNote: payload.adminNote }
  )
  return data.data
}

export async function adminSetDailyCapacity(id: string, maxOrdersPerDay: number): Promise<{ daily_limit: number }> {
  const { data } = await api.put<ApiResponse<{ daily_limit: number }>>(`/vendors/admin/${id}/capacity`, {
    max_orders_per_day: maxOrdersPerDay,
  })
  return data.data
}

export async function adminSetExpressPickup(id: string, available: boolean): Promise<{ express_pickup_available: boolean }> {
  const { data } = await api.put<ApiResponse<{ express_pickup_available: boolean }>>(`/vendors/admin/${id}/express-pickup`, {
    available,
  })
  return data.data
}

export interface VendorTypeResult {
  vendor_type: VendorType
  appSync: boolean
  walletAccess: boolean
}

export async function adminSetVendorType(id: string, vendorType: VendorType): Promise<VendorTypeResult> {
  const { data } = await api.put<ApiResponse<VendorTypeResult>>(`/vendors/admin/${id}/vendor-type`, {
    vendor_type: vendorType,
  })
  return data.data
}

export interface VendorOfferingInput {
  offering: VendorOffering
  /** Blank/null clears the plan label. */
  pos_plan_name?: string | null
  /** YYYY-MM-DD, blank/null clears it. */
  pos_valid_to?: string | null
}

export interface VendorOfferingResult {
  offering: VendorOffering
  pos_onboarding_status: PosOnboardingStatus
  pos_plan_name: string | null
  pos_valid_to: string | null
  allowed_modes: Array<"MARKETPLACE" | "POS">
}

export async function adminSetVendorOffering(id: string, input: VendorOfferingInput): Promise<VendorOfferingResult> {
  const { data } = await api.put<ApiResponse<VendorOfferingResult>>(`/vendors/admin/${id}/offering`, {
    offering: input.offering,
    pos_plan_name: input.pos_plan_name?.trim() ? input.pos_plan_name.trim() : null,
    pos_valid_to: input.pos_valid_to?.trim() ? input.pos_valid_to.trim() : null,
  })
  return data.data
}

export interface GoogleBusinessResult {
  cleared?: boolean
  vendor?: Vendor
}

export interface GoogleBusinessInput {
  url: string
  rating?: number | null
  reviewCount?: number | null
  businessName?: string | null
}

/** Saves (or, with a blank url, removes) a vendor's admin-typed Google Business Profile info. */
export async function adminSetGoogleBusiness(id: string, input: GoogleBusinessInput): Promise<GoogleBusinessResult> {
  const { data } = await api.put<ApiResponse<GoogleBusinessResult>>(`/vendors/admin/${id}/google-business`, {
    google_business_url: input.url,
    google_rating: input.rating ?? null,
    google_review_count: input.reviewCount ?? null,
    google_business_name: input.businessName ?? null,
  })
  return data.data
}

export interface PickupSlotPayload {
  day_of_week: number
  start: string
  end: string
  max_orders?: number
}

export async function adminCreatePickupSlot(id: string, payload: PickupSlotPayload) {
  const { data } = await api.post(`/vendors/admin/${id}/slots`, payload)
  return data.data
}

export async function adminUpdatePickupSlot(
  id: string,
  slotId: string,
  payload: { max_orders?: number; is_active?: boolean; start?: string; end?: string }
) {
  const { data } = await api.patch(`/vendors/admin/${id}/slots/${slotId}`, payload)
  return data.data
}

export async function adminDeletePickupSlot(id: string, slotId: string): Promise<void> {
  await api.delete(`/vendors/admin/${id}/slots/${slotId}`)
}

export interface AdminCreateVendorInput {
  phone: string
  name: string
  owner_name: string
  email?: string
  description?: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  pincode: string
  lat: number
  lng: number
  gst_number?: string
  pan_number?: string
  bank_account_number?: string
  bank_ifsc?: string
  bank_name?: string
  bank_holder_name?: string
  service_radius_km?: number
  daily_capacity?: number
}

/** Creates and approves a vendor directly; the owner signs in with `phone`. */
export async function adminCreateVendor(input: AdminCreateVendorInput): Promise<{ id: string; name: string }> {
  const { data } = await api.post<ApiResponse<{ id: string; name: string }>>("/vendors/admin/create", input)
  return data.data
}

export const KYC_DOCUMENT_TYPES = [
  { value: "owner_identity", label: "Owner ID proof" },
  { value: "shop_photo", label: "Shop photo" },
  { value: "service_list", label: "Service / price list" },
  { value: "gst_certificate", label: "GST certificate" },
  { value: "pan_card", label: "PAN card" },
  { value: "bank_proof", label: "Bank proof / cancelled cheque" },
  { value: "shop_license", label: "Shop licence" },
] as const

/** `document_type` must be appended before `file` (multipart parser reads fields in stream order). */
export async function adminUploadVendorDocument(vendorId: string, documentType: string, file: File) {
  const formData = new FormData()
  formData.append("document_type", documentType)
  formData.append("file", file)
  const { data } = await api.post<ApiResponse<{ id: string }>>(`/vendors/admin/${vendorId}/documents`, formData, {
    timeout: 2 * 60 * 1000,
  })
  return data.data
}

export async function adminDeleteVendorDocument(vendorId: string, documentId: string) {
  await api.delete(`/vendors/admin/${vendorId}/documents/${documentId}`)
}
