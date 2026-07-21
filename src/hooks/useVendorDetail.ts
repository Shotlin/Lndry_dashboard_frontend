"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { getVendorDetails, getKycDocumentBlob } from "@/services/vendors.service"

export function useVendorDetails(id: string | null) {
  return useQuery({
    queryKey: ["vendors", "detail", id],
    queryFn: () => getVendorDetails(id!),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useViewKycDocument() {
  return useMutation({
    mutationFn: (documentId: string) => getKycDocumentBlob(documentId),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank", "noopener,noreferrer")
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    },
    onError: () => {
      toast.error("Failed to load document")
    },
  })
}
