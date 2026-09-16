"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getReferralPrograms,
  createReferralProgram,
  updateReferralProgram,
  deleteReferralProgram,
} from "@/services/referral-programs.service"
import type { CreateReferralProgramPayload, UpdateReferralProgramPayload } from "@/types/referral-program.types"

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object"
  ) {
    const resp = (error as { response?: { data?: { message?: string } } }).response
    if (resp?.data?.message) return resp.data.message
  }
  if (error instanceof Error) return error.message
  return "Something went wrong"
}

export function useReferralPrograms() {
  return useQuery({
    queryKey: ["referral-programs"],
    queryFn: getReferralPrograms,
    staleTime: 30_000,
  })
}

export function useCreateReferralProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateReferralProgramPayload) => createReferralProgram(payload),
    onSuccess: () => {
      toast.success("Referral program created")
      qc.invalidateQueries({ queryKey: ["referral-programs"] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateReferralProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateReferralProgramPayload }) =>
      updateReferralProgram(id, payload),
    onSuccess: () => {
      toast.success("Referral program updated")
      qc.invalidateQueries({ queryKey: ["referral-programs"] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteReferralProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteReferralProgram(id),
    onSuccess: () => {
      toast.success("Referral program deleted")
      qc.invalidateQueries({ queryKey: ["referral-programs"] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
