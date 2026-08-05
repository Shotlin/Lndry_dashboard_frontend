"use client"

import { useQuery } from "@tanstack/react-query"
import { getVendorDetails } from "@/services/vendors.service"

export function useVendorDetails(id: string | null) {
  return useQuery({
    queryKey: ["vendors", "detail", id],
    queryFn: () => getVendorDetails(id!),
    enabled: !!id,
    staleTime: 30_000,
  })
}
