"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
} from "@/services/banners.service"
import { qk } from "@/lib/query-keys"

export function useBanners() {
  const shopKey = "ALL"
  return useQuery({
    queryKey: qk.banners(shopKey, {}),
    queryFn: getBanners,
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useCreateBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof createBanner>[0]) => createBanner(payload),
    onSuccess: () => {
      toast.success("Banner created")
      qc.invalidateQueries({ queryKey: ["banners"] })
    },
    onError: (e: any) => {
      const errMsg = e.response?.data?.message || e.message || "Failed to create banner"
      toast.error(errMsg)
    },
  })
}

export function useUpdateBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateBanner>[1] }) =>
      updateBanner(id, payload),
    onSuccess: () => {
      toast.success("Banner updated")
      qc.invalidateQueries({ queryKey: ["banners"] })
    },
    onError: (e: any) => {
      const errMsg = e.response?.data?.message || e.message || "Failed to update banner"
      toast.error(errMsg)
    },
  })
}

export function useDeleteBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBanner(id),
    onSuccess: () => {
      toast.success("Banner deleted")
      qc.invalidateQueries({ queryKey: ["banners"] })
    },
    onError: (e: any) => {
      const errMsg = e.response?.data?.message || e.message || "Failed to delete banner"
      toast.error(errMsg)
    },
  })
}

export function useReorderBanners() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderBanners(orderedIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["banners"] })
    },
    onError: (e: any) => {
      const errMsg = e.response?.data?.message || e.message || "Failed to reorder banners"
      toast.error(errMsg)
    },
  })
}
