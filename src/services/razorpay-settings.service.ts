import api from "@/lib/api"
import type { ApiResponse } from "@/types"
import type {
  ConnectionTestResult,
  RazorpayMode,
  RazorpaySettings,
  SaveRazorpayModePayload,
} from "@/types/integration-settings.types"

/**
 * Talks to `/api/v1/admin/razorpay-settings`. Secrets are write-only: the
 * server only ever sends back the Key ID and a masked preview of the secret.
 * Saving / switching / removing needs the TOTP step-up (handled by lib/api).
 */
export const razorpaySettingsService = {
  async get(): Promise<RazorpaySettings> {
    const { data } = await api.get<ApiResponse<RazorpaySettings>>(
      "/admin/razorpay-settings",
    )
    return data.data
  },

  /** Leave keyId / keySecret blank to test the keys that are already saved. */
  async test(
    mode: RazorpayMode,
    creds: { keyId?: string; keySecret?: string },
  ): Promise<ConnectionTestResult> {
    const { data } = await api.post<ApiResponse<ConnectionTestResult>>(
      "/admin/razorpay-settings/test",
      { mode, ...creds },
    )
    return data.data
  },

  async save(
    mode: RazorpayMode,
    payload: SaveRazorpayModePayload,
  ): Promise<{ settings: RazorpaySettings; testResult: ConnectionTestResult | null; takesEffectNow: boolean }> {
    const { data } = await api.put<
      ApiResponse<{ settings: RazorpaySettings; testResult: ConnectionTestResult | null; takesEffectNow: boolean }>
    >(`/admin/razorpay-settings/modes/${mode}`, payload)
    return data.data
  },

  async setActiveMode(
    mode: RazorpayMode,
  ): Promise<{ settings: RazorpaySettings; warnings: string[] }> {
    const { data } = await api.put<
      ApiResponse<{ settings: RazorpaySettings; warnings: string[] }>
    >("/admin/razorpay-settings/active-mode", { mode })
    return data.data
  },

  async remove(mode: RazorpayMode): Promise<{ settings: RazorpaySettings }> {
    const { data } = await api.delete<ApiResponse<{ settings: RazorpaySettings }>>(
      `/admin/razorpay-settings/modes/${mode}`,
    )
    return data.data
  },
}
