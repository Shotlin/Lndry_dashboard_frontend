"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getSettings,
  updateSettings,
  getStepUpSetting,
  setStepUpSetting,
} from "@/services/settings.service"
import { qk } from "@/lib/query-keys"
import type { UpdateSettingsPayload } from "@/types/settings.types"

export function useSettings() {
  const shopKey = "ALL"

  return useQuery({
    queryKey: qk.settings(shopKey, {}),
    queryFn: getSettings,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateSettingsPayload) => updateSettings(payload),
    onSuccess: () => {
      toast.success("Settings saved")
      qc.invalidateQueries({ queryKey: ["settings"] })
    },
    onError: () => toast.error("Failed to save settings"),
  })
}

export function useStepUpSetting() {
  return useQuery({
    queryKey: ["step-up-setting"],
    queryFn: getStepUpSetting,
    staleTime: 10_000,
  })
}

export function useSetStepUpSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (enabled: boolean) => setStepUpSetting(enabled),
    onSuccess: (res) => {
      toast.success(`Two-step verification turned ${res.enabled ? "ON" : "OFF"}`)
      qc.invalidateQueries({ queryKey: ["step-up-setting"] })
    },
    onError: () => toast.error("Failed to change two-step verification"),
  })
}
