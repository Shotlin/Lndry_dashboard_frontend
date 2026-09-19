"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getAccountDeletionRequests,
  approveAccountDeletion,
  rejectAccountDeletion,
  type AccountDeletionListParams,
} from "@/services/account-deletion.service"

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

const KEY = ["account-deletion-requests"]

export function useAccountDeletionRequests(params: AccountDeletionListParams) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => getAccountDeletionRequests(params),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  })
}

export function useApproveAccountDeletion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => approveAccountDeletion(id, note),
    onSuccess: () => {
      toast.success("Approved — account deactivated, 30-day deletion period started")
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useRejectAccountDeletion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => rejectAccountDeletion(id, note),
    onSuccess: () => {
      toast.success("Request rejected — the account stays active")
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
