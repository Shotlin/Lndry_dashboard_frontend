"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getAssistedBooking, updateAssistedBooking } from "@/services/assisted-booking.service"
import type { UpdateAssistedBookingPayload } from "@/types"

export function assistedBookingErrorMessage(error: unknown): string {
  const resp = (error as { response?: { data?: { message?: string } } })?.response
  if (resp?.data?.message) return resp.data.message
  if (error instanceof Error) return error.message
  return "Something went wrong"
}

const KEY = ["assisted-booking"]

export function useAssistedBooking() {
  return useQuery({ queryKey: KEY, queryFn: getAssistedBooking, staleTime: 30_000 })
}

export function useUpdateAssistedBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateAssistedBookingPayload) => updateAssistedBooking(payload),
    onSuccess: (saved) => {
      // Shown only once the backend has confirmed and returned what it stored.
      toast.success("Assisted booking settings saved")
      qc.setQueryData(KEY, saved)
    },
    onError: (err) => toast.error(assistedBookingErrorMessage(err)),
  })
}
