"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getHelpFaqs,
  createHelpFaq,
  updateHelpFaq,
  deleteHelpFaq,
} from "@/services/help-faqs.service"
import type { CreateHelpFaqPayload, UpdateHelpFaqPayload } from "@/types"

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

const KEY = ["help-faqs"]

export function useHelpFaqs() {
  return useQuery({ queryKey: KEY, queryFn: getHelpFaqs, staleTime: 30_000 })
}

export function useCreateHelpFaq() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateHelpFaqPayload) => createHelpFaq(payload),
    onSuccess: () => {
      toast.success("FAQ added")
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateHelpFaq(opts?: { silent?: boolean }) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateHelpFaqPayload }) =>
      updateHelpFaq(id, payload),
    onSuccess: () => {
      if (!opts?.silent) toast.success("FAQ updated")
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteHelpFaq() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteHelpFaq(id),
    onSuccess: () => {
      toast.success("FAQ deleted")
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
