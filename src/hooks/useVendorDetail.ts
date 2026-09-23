"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getVendorDetails,
  adminSetExpressPickup,
  adminSetVendorType,
  adminSetGoogleBusiness,
  type VendorType,
  type GoogleBusinessInput,
} from "@/services/vendors.service"

export function useVendorDetails(id: string | null) {
  return useQuery({
    queryKey: ["vendors", "detail", id],
    queryFn: () => getVendorDetails(id!),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useSetExpressPickup(vendorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (available: boolean) => adminSetExpressPickup(vendorId, available),
    onSuccess: (res) => {
      toast.success(res.express_pickup_available ? "Express pickup enabled" : "Express pickup disabled")
      queryClient.invalidateQueries({ queryKey: ["vendors", "detail", vendorId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update express pickup")
    },
  })
}

export function useSetVendorType(vendorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vendorType: VendorType) => adminSetVendorType(vendorId, vendorType),
    onSuccess: (res) => {
      toast.success(`Vendor type set to ${res.vendor_type.charAt(0)}${res.vendor_type.slice(1).toLowerCase()}`)
      queryClient.invalidateQueries({ queryKey: ["vendors", "detail", vendorId] })
      queryClient.invalidateQueries({ queryKey: ["vendors", "admin-list"] })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update vendor type")
    },
  })
}

/**
 * Saves (or, with a blank url, removes) a vendor's Google Business Profile
 * info — the admin pastes the link and types in the rating/review count
 * they see on the vendor's own Google listing. No server-side lookup.
 */
export function useSetGoogleBusiness(vendorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: GoogleBusinessInput) => adminSetGoogleBusiness(vendorId, input),
    onSuccess: (res) => {
      toast.success(res.cleared ? "Google Business link removed" : "Google Business Profile saved")
      queryClient.invalidateQueries({ queryKey: ["vendors", "detail", vendorId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update the Google Business Profile")
    },
  })
}
