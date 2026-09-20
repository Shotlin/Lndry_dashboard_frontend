"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getVendorDetails, adminSetExpressPickup, adminSetVendorType, type VendorType } from "@/services/vendors.service"

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
