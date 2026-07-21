import api from "@/lib/api"
import type { ApiResponse } from "@/types"

export interface WatermarkSettings {
  enabled: boolean
  text: string
  logo_url?: string | null
  position: string
  scale: number
  opacity: number
}

export interface WatermarkJob {
  id: string
  asset_id: string
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
  error_message?: string | null
  created_at: string
  updated_at: string
}

export async function getWatermarkSettings(): Promise<WatermarkSettings> {
  const { data } = await api.get<ApiResponse<WatermarkSettings>>("/vendors/admin/watermark/settings")
  return data.data
}

export async function updateWatermarkSettings(payload: WatermarkSettings): Promise<void> {
  await api.put("/vendors/admin/watermark/settings", payload)
}

export async function getWatermarkJobs(): Promise<WatermarkJob[]> {
  const { data } = await api.get<ApiResponse<WatermarkJob[]>>("/vendors/admin/watermark/jobs")
  return data.data || []
}

export async function createWatermarkJob(assetId: string): Promise<WatermarkJob> {
  const { data } = await api.post<ApiResponse<WatermarkJob>>("/vendors/admin/watermark/jobs", {
    asset_id: assetId,
  })
  return data.data
}
