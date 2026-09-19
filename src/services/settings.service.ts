import api from "@/lib/api"
import type { ApiResponse } from "@/types"
import type {
  AppSettings,
  UpdateSettingsPayload,
} from "@/types/settings.types"

export async function getSettings(): Promise<AppSettings> {
  const { data } = await api.get<ApiResponse<AppSettings>>("/admin/settings")
  return data.data
}

export async function updateSettings(
  payload: UpdateSettingsPayload
): Promise<AppSettings> {
  const { data } = await api.put<ApiResponse<AppSettings>>(
    "/admin/settings",
    payload
  )
  return data.data
}

/** Is admin two-step (step-up) verification currently enforced? */
export async function getStepUpSetting(): Promise<{ enabled: boolean }> {
  const { data } = await api.get<ApiResponse<{ enabled: boolean }>>(
    "/admin/security/step-up"
  )
  return data.data
}

/**
 * Turn two-step verification ON or OFF. While it is ON, turning it OFF is
 * itself a protected action (the api interceptor prompts for the code).
 */
export async function setStepUpSetting(
  enabled: boolean
): Promise<{ enabled: boolean }> {
  const { data } = await api.put<ApiResponse<{ enabled: boolean }>>(
    "/admin/security/step-up",
    { enabled }
  )
  return data.data
}
