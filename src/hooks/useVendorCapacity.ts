"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getVendorCapacity,
  reviewCapacityRequest,
  adminSetDailyCapacity,
  adminCreatePickupSlot,
  adminUpdatePickupSlot,
  adminDeletePickupSlot,
} from "@/services/vendors.service"
import type { CapacityRequest, PickupSlotPayload } from "@/services/vendors.service"

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

function useInvalidateVendorCapacity(vendorId: string) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ["vendor-capacity", vendorId] })
    queryClient.invalidateQueries({ queryKey: ["vendors", "detail", vendorId] })
    queryClient.invalidateQueries({ queryKey: ["vendors"] })
  }
}

export function useSetDailyCapacity(vendorId: string) {
  const invalidate = useInvalidateVendorCapacity(vendorId)
  return useMutation({
    mutationFn: (maxOrdersPerDay: number) => adminSetDailyCapacity(vendorId, maxOrdersPerDay),
    onSuccess: () => {
      toast.success("Daily capacity updated")
      invalidate()
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update daily capacity")
    },
  })
}

export function useCreatePickupSlot(vendorId: string) {
  const invalidate = useInvalidateVendorCapacity(vendorId)
  return useMutation({
    mutationFn: (payload: PickupSlotPayload) => adminCreatePickupSlot(vendorId, payload),
    onSuccess: () => {
      toast.success("Slot added")
      invalidate()
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add slot")
    },
  })
}

export function useUpdatePickupSlot(vendorId: string) {
  const invalidate = useInvalidateVendorCapacity(vendorId)
  return useMutation({
    mutationFn: ({ slotId, payload }: { slotId: string; payload: { max_orders?: number; is_active?: boolean; start?: string; end?: string } }) =>
      adminUpdatePickupSlot(vendorId, slotId, payload),
    onSuccess: () => invalidate(),
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update slot")
    },
  })
}

export function useDeletePickupSlot(vendorId: string) {
  const invalidate = useInvalidateVendorCapacity(vendorId)
  return useMutation({
    mutationFn: (slotId: string) => adminDeletePickupSlot(vendorId, slotId),
    onSuccess: () => {
      toast.success("Slot removed")
      invalidate()
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove slot")
    },
  })
}
