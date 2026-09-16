"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getReconciliationProblemTypes,
  createReconciliationProblemType,
  updateReconciliationProblemType,
  deleteReconciliationProblemType,
} from "@/services/reconciliation-problem-types.service"
import type {
  CreateReconciliationProblemTypePayload,
  UpdateReconciliationProblemTypePayload,
} from "@/types/reconciliation-problem-type.types"

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

export function useReconciliationProblemTypes() {
  return useQuery({
    queryKey: ["reconciliation-problem-types"],
    queryFn: getReconciliationProblemTypes,
    staleTime: 30_000,
  })
}

export function useCreateReconciliationProblemType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateReconciliationProblemTypePayload) => createReconciliationProblemType(payload),
    onSuccess: () => {
      toast.success("Problem type created")
      qc.invalidateQueries({ queryKey: ["reconciliation-problem-types"] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateReconciliationProblemType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateReconciliationProblemTypePayload }) =>
      updateReconciliationProblemType(id, payload),
    onSuccess: () => {
      toast.success("Problem type updated")
      qc.invalidateQueries({ queryKey: ["reconciliation-problem-types"] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteReconciliationProblemType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteReconciliationProblemType(id),
    onSuccess: () => {
      toast.success("Problem type deleted")
      qc.invalidateQueries({ queryKey: ["reconciliation-problem-types"] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
