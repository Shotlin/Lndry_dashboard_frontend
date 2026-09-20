"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  duplicateTemplate,
  deleteTemplate,
  getCampaigns,
  getCampaign,
  createCampaign,
  updateDraft,
  sendDraft,
  cancelCampaign,
  deleteCampaign,
  countAudience,
  searchRecipients,
  sendTest,
  getLifecycleEvents,
  saveLifecycleEvent,
  resetLifecycleEvent,
  testLifecycleEvent,
  getLifecycleLog,
} from "@/services/notifications.service"
import type {
  LifecycleLogStatus,
  SaveLifecyclePayload,
  AudienceSpec,
  CampaignStatus,
  CreateCampaignPayload,
  CreateTemplatePayload,
  RecipientType,
  TestSendPayload,
  UpdateTemplatePayload,
} from "@/types/notification.types"

/** Pull the backend's plain-language message out of an API error. */
export function notificationErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  const resp = (error as { response?: { data?: { message?: string } } })?.response
  if (resp?.data?.message) return resp.data.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}

const KEY = ["notifications"] as const

/* ── Templates ───────────────────────────────────── */

export function useTemplates() {
  return useQuery({
    queryKey: [...KEY, "templates"] as const,
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
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (e) => toast.error(notificationErrorMessage(e, "Failed to create template")),
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTemplatePayload }) => updateTemplate(id, payload),
    onSuccess: () => {
      toast.success("Template saved")
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (e) => toast.error(notificationErrorMessage(e, "Failed to save template")),
  })
}

export function useDuplicateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => duplicateTemplate(id),
    onSuccess: () => {
      toast.success("Template duplicated")
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (e) => toast.error(notificationErrorMessage(e, "Failed to duplicate template")),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      toast.success("Template deleted")
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (e) => toast.error(notificationErrorMessage(e, "Failed to delete template")),
  })
}

/* ── Campaigns ───────────────────────────────────── */

export function useCampaigns(page = 1, limit = 20, status?: CampaignStatus) {
  return useQuery({
    queryKey: [...KEY, "campaigns", page, limit, status ?? "all"] as const,
    queryFn: () => getCampaigns(page, limit, status),
    staleTime: 10_000,
    placeholderData: (prev) => prev,
    // A campaign that is sending or waiting for its time keeps changing.
    refetchInterval: (query) => {
      const list = query.state.data?.campaigns ?? []
      return list.some((c) => c.status === "SENDING" || c.status === "SCHEDULED") ? 10_000 : false
    },
  })
}

export function useCampaign(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "campaign", id] as const,
    queryFn: () => getCampaign(id as string),
    enabled: !!id,
    refetchInterval: (query) => (query.state.data?.status === "SENDING" ? 5_000 : false),
  })
}

export function useCreateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCampaignPayload) => createCampaign(payload),
    onSuccess: (c) => {
      toast.success(
        c.status === "SCHEDULED" ? "Notification scheduled"
        : c.status === "DRAFT" ? "Draft saved"
        : `Sending to ${c.device_count} device${c.device_count === 1 ? "" : "s"}`
      )
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (e) => toast.error(notificationErrorMessage(e, "Could not create the notification")),
  })
}

export function useUpdateDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateDraft>[1] }) => updateDraft(id, payload),
    onSuccess: () => {
      toast.success("Draft updated")
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (e) => toast.error(notificationErrorMessage(e, "Could not update the draft")),
  })
}

export function useSendDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; mode: "SEND_NOW" | "SCHEDULE"; scheduledAt?: string }) => sendDraft(id, payload),
    onSuccess: (c) => {
      toast.success(c.status === "SCHEDULED" ? "Notification scheduled" : "Sending now")
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (e) => toast.error(notificationErrorMessage(e, "Could not send the draft")),
  })
}

export function useCancelCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelCampaign(id),
    onSuccess: () => {
      toast.success("Scheduled notification cancelled")
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (e) => toast.error(notificationErrorMessage(e, "Could not cancel")),
  })
}

export function useDeleteCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCampaign(id),
    onSuccess: () => {
      toast.success("Deleted")
      qc.invalidateQueries({ queryKey: KEY })
    },
    onError: (e) => toast.error(notificationErrorMessage(e, "Could not delete")),
  })
}

/* ── Audience / recipients / test ─────────────────── */

/** Live numbers for the audience being composed (real registered devices). */
export function useAudienceCount(audience: AudienceSpec | null) {
  return useQuery({
    queryKey: [...KEY, "audience-count", audience] as const,
    queryFn: () => countAudience(audience as AudienceSpec),
    enabled: !!audience,
    staleTime: 15_000,
    retry: false,
  })
}

export function useRecipientSearch(q: string, type: RecipientType, enabled = true) {
  return useQuery({
    queryKey: [...KEY, "recipients", type, q] as const,
    queryFn: () => searchRecipients(q, type),
    enabled: enabled && q.trim().length >= 2,
    staleTime: 20_000,
    placeholderData: (prev) => prev,
  })
}

export function useSendTest() {
  return useMutation({
    mutationFn: (payload: TestSendPayload) => sendTest(payload),
    onError: (e) => toast.error(notificationErrorMessage(e, "Test could not be sent")),
  })
}

/* ── Order lifecycle notifications ────────────────── */

export function useLifecycleEvents() {
  return useQuery({
    queryKey: [...KEY, "lifecycle"] as const,
    queryFn: getLifecycleEvents,
    staleTime: 30_000,
  })
}

export function useSaveLifecycleEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventKey, payload }: { eventKey: string; payload: SaveLifecyclePayload }) =>
      saveLifecycleEvent(eventKey, payload),
    onSuccess: () => {
      toast.success("Saved — new orders use this wording right away")
      qc.invalidateQueries({ queryKey: [...KEY, "lifecycle"] })
    },
    onError: (e) => toast.error(notificationErrorMessage(e, "Could not save")),
  })
}

export function useResetLifecycleEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (eventKey: string) => resetLifecycleEvent(eventKey),
    onSuccess: () => {
      toast.success("Restored the default wording")
      qc.invalidateQueries({ queryKey: [...KEY, "lifecycle"] })
    },
    onError: (e) => toast.error(notificationErrorMessage(e, "Could not restore the default")),
  })
}

export function useTestLifecycleEvent() {
  return useMutation({
    mutationFn: ({ eventKey, userId }: { eventKey: string; userId: string }) => testLifecycleEvent(eventKey, userId),
    onError: (e) => toast.error(notificationErrorMessage(e, "Test could not be sent")),
  })
}

export function useLifecycleLog(params: { page: number; limit: number; event?: string; status?: LifecycleLogStatus; order?: string }) {
  return useQuery({
    queryKey: [...KEY, "lifecycle-log", params] as const,
    queryFn: () => getLifecycleLog(params),
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  })
}
