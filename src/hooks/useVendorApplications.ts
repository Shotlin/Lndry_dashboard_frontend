"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { reviewVendorApplication, updateVendorApplicationDetails } from "@/services/vendors.service"
import type { ReviewApplicationPayload, UpdateApplicationDetailsPayload, Vendor } from "@/services/vendors.service"

export function useReviewVendorApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReviewApplicationPayload }) =>
      reviewVendorApplication(id, payload),
    onSuccess: (vendor: Vendor) => {
      toast.success(
        vendor.status === "APPROVED"
          ? `${vendor.name} approved`
          : vendor.status === "REJECTED"
            ? `${vendor.name} rejected`
            : `${vendor.name} application updated`
      )
      queryClient.invalidateQueries({ queryKey: ["vendor-applications-list"] })
      queryClient.invalidateQueries({ queryKey: ["vendors"] })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update application")
    },
  })
}

export function useUpdateVendorApplicationDetails() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateApplicationDetailsPayload }) =>
      updateVendorApplicationDetails(id, payload),
    onSuccess: (vendor: Vendor) => {
      toast.success("Details updated")
      queryClient.invalidateQueries({ queryKey: ["vendors", "detail", vendor.id] })
      queryClient.invalidateQueries({ queryKey: ["vendor-applications-list"] })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update details")
    },
  })
}
