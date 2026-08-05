"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getVendorCapacity, reviewCapacityRequest } from "@/services/vendors.service"
import type { CapacityRequest } from "@/services/vendors.service"

export function useVendorCapacity(id: string | null) {
  return useQuery({
    queryKey: ["vendor-capacity", id],
    queryFn: () => getVendorCapacity(id!),
    enabled: !!id,
    staleTime: 15_000,
  })
}

export function useReviewCapacityRequest(vendorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, status, adminNote }: { requestId: string; status: "APPROVED" | "REJECTED"; adminNote?: string }) =>
      reviewCapacityRequest(requestId, { status, adminNote }),
    onSuccess: (request: CapacityRequest) => {
      toast.success(request.status === "APPROVED" ? "Capacity request approved" : "Capacity request rejected")
      queryClient.invalidateQueries({ queryKey: ["vendor-capacity", vendorId] })
      queryClient.invalidateQueries({ queryKey: ["vendors", "detail", vendorId] })
      queryClient.invalidateQueries({ queryKey: ["vendors"] })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to review capacity request")
    },
  })
}
