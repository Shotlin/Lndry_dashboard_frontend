"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getIncompleteOrders,
  getIncompleteOrdersSummary,
  getIncompleteOrderDetail,
  sendRecoveryReminder,
  issueRecoveryCoupon,
} from "@/services/order-recovery.service"
import type { IssueRecoveryCouponPayload, SendRecoveryReminderPayload } from "@/types/order-recovery.types"

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

export function useIncompleteOrders(params: { page?: number; limit?: number; search?: string } = {}) {
  return useQuery({
    queryKey: ["incomplete-orders", params],
    queryFn: () => getIncompleteOrders(params),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  })
}

export function useIncompleteOrdersSummary() {
  return useQuery({
    queryKey: ["incomplete-orders", "summary"],
    queryFn: getIncompleteOrdersSummary,
    staleTime: 15_000,
  })
}

export function useIncompleteOrderDetail(id: string | null) {
  return useQuery({
    queryKey: ["incomplete-orders", id],
    queryFn: () => getIncompleteOrderDetail(id as string),
    enabled: !!id,
  })
}

export function useSendRecoveryReminder(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SendRecoveryReminderPayload) => sendRecoveryReminder(id, payload),
    onSuccess: () => {
      toast.success("Reminder sent")
      qc.invalidateQueries({ queryKey: ["incomplete-orders"] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useIssueRecoveryCoupon(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: IssueRecoveryCouponPayload) => issueRecoveryCoupon(id, payload),
    onSuccess: (result) => {
      toast.success(result.code ? `Coupon ${result.code} issued` : "Coupon issued")
      qc.invalidateQueries({ queryKey: ["incomplete-orders"] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
