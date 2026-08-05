"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getVendorCategories,
  getVendorServicesAdmin,
  createVendorServiceAdmin,
  getVendorServiceDetailsAdmin,
  updateVendorServiceAdmin,
  deleteVendorServiceAdmin,
  addGarmentRateAdmin,
  updateGarmentRateAdmin,
  deleteGarmentRateAdmin,
} from "@/services/vendor-catalogue.service"

export function useVendorCategories() {
  return useQuery({
    queryKey: ["vendor-categories"],
    queryFn: getVendorCategories,
    staleTime: 5 * 60_000,
  })
}

export function useVendorServicesAdmin(vendorId: string | null) {
  return useQuery({
    queryKey: ["vendor-catalogue", vendorId],
    queryFn: () => getVendorServicesAdmin(vendorId!),
    enabled: !!vendorId,
    staleTime: 15_000,
  })
}

export function useVendorServiceDetailsAdmin(vendorId: string, serviceId: string | null) {
  return useQuery({
    queryKey: ["vendor-catalogue", vendorId, "service", serviceId],
    queryFn: () => getVendorServiceDetailsAdmin(vendorId, serviceId!),
    enabled: !!serviceId,
  })
}

function useInvalidateCatalogue(vendorId: string) {
  const queryClient = useQueryClient()
  return (serviceId?: string) => {
    queryClient.invalidateQueries({ queryKey: ["vendor-catalogue", vendorId] })
    if (serviceId) queryClient.invalidateQueries({ queryKey: ["vendor-catalogue", vendorId, "service", serviceId] })
  }
}

export function useCreateVendorServiceAdmin(vendorId: string) {
  const invalidate = useInvalidateCatalogue(vendorId)
  return useMutation({
    mutationFn: (payload: { category_id: string; name?: string; description?: string; price_per_piece?: number; min_weight_kg?: number }) =>
      createVendorServiceAdmin(vendorId, payload),
    onSuccess: () => {
      toast.success("Service added")
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message || "Failed to add service"),
  })
}

export function useUpdateVendorServiceAdmin(vendorId: string) {
  const invalidate = useInvalidateCatalogue(vendorId)
  return useMutation({
    mutationFn: ({ serviceId, payload }: { serviceId: string; payload: { name?: string; description?: string; price_per_piece?: number; min_weight_kg?: number; is_available?: boolean } }) =>
      updateVendorServiceAdmin(vendorId, serviceId, payload),
    onSuccess: (_data, vars) => {
      toast.success("Service updated")
      invalidate(vars.serviceId)
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update service"),
  })
}

export function useDeleteVendorServiceAdmin(vendorId: string) {
  const invalidate = useInvalidateCatalogue(vendorId)
  return useMutation({
    mutationFn: (serviceId: string) => deleteVendorServiceAdmin(vendorId, serviceId),
    onSuccess: () => {
      toast.success("Service removed")
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message || "Failed to remove service"),
  })
}

export function useAddGarmentRateAdmin(vendorId: string) {
  const invalidate = useInvalidateCatalogue(vendorId)
  return useMutation({
    mutationFn: ({ serviceId, payload }: { serviceId: string; payload: { garment_type_id?: string; garment_type_name?: string; rate_unit?: string; rate_paise: number } }) =>
      addGarmentRateAdmin(vendorId, serviceId, payload),
    onSuccess: (_data, vars) => {
      toast.success("Rate added")
      invalidate(vars.serviceId)
    },
    onError: (error: Error) => toast.error(error.message || "Failed to add rate"),
  })
}

export function useUpdateGarmentRateAdmin(vendorId: string) {
  const invalidate = useInvalidateCatalogue(vendorId)
  return useMutation({
    mutationFn: ({ serviceId, garmentTypeId, payload }: { serviceId: string; garmentTypeId: string; payload: { rate_paise?: number; is_available?: boolean } }) =>
      updateGarmentRateAdmin(vendorId, serviceId, garmentTypeId, payload),
    onSuccess: (_data, vars) => invalidate(vars.serviceId),
    onError: (error: Error) => toast.error(error.message || "Failed to update rate"),
  })
}

export function useDeleteGarmentRateAdmin(vendorId: string) {
  const invalidate = useInvalidateCatalogue(vendorId)
  return useMutation({
    mutationFn: ({ serviceId, garmentTypeId }: { serviceId: string; garmentTypeId: string }) =>
      deleteGarmentRateAdmin(vendorId, serviceId, garmentTypeId),
    onSuccess: (_data, vars) => {
      toast.success("Rate removed")
      invalidate(vars.serviceId)
    },
    onError: (error: Error) => toast.error(error.message || "Failed to remove rate"),
  })
}
