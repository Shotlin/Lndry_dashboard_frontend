"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getProductReviews,
  replyToReview,
  moderateReview,
  deleteReview,
} from "@/services/reviews.service"
import type { ReviewFilters } from "@/types/review.types"
import { qk } from "@/lib/query-keys"

export function useProductReviews(
  productId: string | null,
  filters: ReviewFilters = {}
) {
  const shopKey = "ALL"

  return useQuery({
    queryKey: qk.reviews(shopKey, { ...filters, productId } as any),
    queryFn: () => getProductReviews(productId!, filters),
    enabled: !!productId,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useReplyReview(_productId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) =>
      replyToReview(reviewId, reply),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] })
      toast.success("Reply posted")
    },
    onError: () => toast.error("Failed to post reply"),
  })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useModerateReview(_productId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      reviewId,
      status,
    }: {
      reviewId: string
      status: "approved" | "hidden" | "spam"
    }) => moderateReview(reviewId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] })
      toast.success("Review status updated")
    },
    onError: () => toast.error("Failed to moderate review"),
  })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useDeleteReview(_productId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reviewId: string) => deleteReview(reviewId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] })
      toast.success("Review deleted")
    },
    onError: () => toast.error("Failed to delete review"),
  })
}
