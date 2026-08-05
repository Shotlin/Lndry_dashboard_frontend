import api from "@/lib/api"
import type { ApiResponse } from "@/types"

// Reuses the backend's already-built, admin-accessible vendor-employees
// module (`/api/v1/vendors/:shopId/staff` — see vendor-employees.routes.js).
// No backend changes needed for any of this file.

export const STAFF_ROLES = ["VENDOR_OWNER", "VENDOR_STAFF", "VENDOR_RIDER"] as const
export type StaffRole = (typeof STAFF_ROLES)[number]

export interface StaffMember {
  id: string
  user_id: string
  vendor_id: string
  role: StaffRole
  permissions: string[]
  is_active: boolean
  invited_by: string | null
  created_at: string
  updated_at: string
  user_name?: string | null
  user_email?: string | null
  user_phone?: string | null
  temp_password?: string
}

export interface StaffListResponse {
  staff: StaffMember[]
  total: number
}

export async function getVendorStaff(
  vendorId: string,
  params?: { role?: StaffRole; is_active?: "true" | "false" }
): Promise<StaffListResponse> {
  const { data } = await api.get<ApiResponse<StaffListResponse>>(
    `/vendors/${vendorId}/staff`,
    { params }
  )
  return data.data
}

export interface CreateStaffPayload {
  name: string
  email?: string
  phone?: string
  role: StaffRole
  generate_temp_password?: boolean
}

export async function createVendorStaff(
  vendorId: string,
  payload: CreateStaffPayload
): Promise<StaffMember> {
  const { data } = await api.post<ApiResponse<StaffMember>>(
    `/vendors/${vendorId}/staff`,
    payload
  )
  return data.data
}

export async function updateVendorStaff(
  vendorId: string,
  staffId: string,
  payload: { role?: StaffRole; is_active?: boolean }
): Promise<StaffMember> {
  const { data } = await api.patch<ApiResponse<StaffMember>>(
    `/vendors/${vendorId}/staff/${staffId}`,
    payload
  )
  return data.data
}

export async function deactivateVendorStaff(vendorId: string, staffId: string): Promise<void> {
  await api.delete(`/vendors/${vendorId}/staff/${staffId}`)
}

export async function resetVendorStaffPassword(
  vendorId: string,
  staffId: string
): Promise<{ temp_password: string }> {
  const { data } = await api.post<ApiResponse<{ temp_password: string }>>(
    `/vendors/${vendorId}/staff/${staffId}/reset-password`
  )
  return data.data
}
