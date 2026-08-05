"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getVendorStaff,
  createVendorStaff,
  updateVendorStaff,
  deactivateVendorStaff,
  resetVendorStaffPassword,
} from "@/services/shop-staff.service"
import type { CreateStaffPayload, StaffMember, StaffRole } from "@/services/shop-staff.service"

export function useVendorStaff(vendorId: string | null) {
  return useQuery({
    queryKey: ["vendor-staff", vendorId],
    queryFn: () => getVendorStaff(vendorId!),
    enabled: !!vendorId,
    staleTime: 15_000,
  })
}

export function useCreateVendorStaff(vendorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateStaffPayload) => createVendorStaff(vendorId, payload),
    onSuccess: (staff: StaffMember) => {
      toast.success(`${staff.user_name ?? "Staff member"} added`)
      queryClient.invalidateQueries({ queryKey: ["vendor-staff", vendorId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add staff member")
    },
  })
}

export function useUpdateVendorStaff(vendorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ staffId, payload }: { staffId: string; payload: { role?: StaffRole; is_active?: boolean } }) =>
      updateVendorStaff(vendorId, staffId, payload),
    onSuccess: () => {
      toast.success("Staff record updated")
      queryClient.invalidateQueries({ queryKey: ["vendor-staff", vendorId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update staff member")
    },
  })
}

export function useDeactivateVendorStaff(vendorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (staffId: string) => deactivateVendorStaff(vendorId, staffId),
    onSuccess: () => {
      toast.success("Staff member deactivated")
      queryClient.invalidateQueries({ queryKey: ["vendor-staff", vendorId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to deactivate staff member")
    },
  })
}

export function useResetVendorStaffPassword(vendorId: string) {
  return useMutation({
    mutationFn: (staffId: string) => resetVendorStaffPassword(vendorId, staffId),
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reset password")
    },
  })
}
