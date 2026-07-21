"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getCampaigns,
  sendBulk,
  scheduleCampaign,
  getSegmentCount,
} from "@/services/notifications.service"
import type {
  CreateTemplatePayload,
  UpdateTemplatePayload,
  SendBulkPayload,
  ScheduleCampaignPayload,
  CampaignSegment,
} from "@/types/notification.types"

function useShopKey(): string {
  return "ALL"
}

/* ── Templates ───────────────────────────────────── */

export function useTemplates() {
  const shopKey = useShopKey()
  return useQuery({
    queryKey: ["notifications", shopKey, "templates"] as const,
    queryFn: getTemplates,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTemplatePayload) => createTemplate(payload),
    onSuccess: () => {
      toast.success("Template created")
      qc.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: () => toast.error("Failed to create template"),
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTemplatePayload }) =>
      updateTemplate(id, payload),
    onSuccess: () => {
      toast.success("Template updated")
      qc.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: () => toast.error("Failed to update template"),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      toast.success("Template deleted")
      qc.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: () => toast.error("Failed to delete template"),
  })
}

/* ── Campaigns ───────────────────────────────────── */

export function useCampaigns(page = 1, limit = 20) {
  const shopKey = useShopKey()
  return useQuery({
    queryKey: ["notifications", shopKey, "campaigns", page, limit] as const,
    queryFn: () => getCampaigns(page, limit),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

export function useSendBulk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SendBulkPayload) => sendBulk(payload),
    onSuccess: (data) => {
      toast.success(`Notification queued for ${data.target_count ?? data.sent_count ?? '?'} users`)
      qc.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: () => toast.error("Failed to send notification"),
  })
}

export function useScheduleCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ScheduleCampaignPayload) => scheduleCampaign(payload),
    onSuccess: () => {
      toast.success("Campaign scheduled")
      qc.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: () => toast.error("Failed to schedule campaign"),
  })
}

export function useSegmentCount(segment: CampaignSegment, segmentValue?: string) {
  const shopKey = useShopKey()
  return useQuery({
    queryKey: ["notifications", shopKey, "segment-count", segment, segmentValue] as const,
    queryFn: () => getSegmentCount(segment, segmentValue),
    enabled: segment !== "cart_not_empty",
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })
}
