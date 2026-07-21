"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getPayments, issuePaymentRefund } from "@/services/payments-admin.service"
import type { PaymentFilters } from "@/services/payments-admin.service"

export function usePayments(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: ["admin-payments", filters] as const,
    queryFn: () => getPayments(filters),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

export function useIssueRefund() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      paymentId,
      amount,
      reason,
    }: {
      paymentId: string
      amount?: number
      reason?: string
    }) => issuePaymentRefund(paymentId, { amount, reason }),
    onSuccess: () => {
      toast.success("Refund initiated")
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to issue refund")
    },
  })
}
