"use client"

import { useQuery } from "@tanstack/react-query"
import { getReferrals, getReferralsSummary } from "@/services/referrals.service"

export function useReferralsSummary() {
  return useQuery({
    queryKey: ["referrals", "summary"],
    queryFn: getReferralsSummary,
    staleTime: 30_000,
  })
}

export function useReferrals(params: { search?: string; limit?: number }) {
  return useQuery({
    queryKey: ["referrals", params],
    queryFn: () => getReferrals(params),
    staleTime: 15_000,
  })
}
