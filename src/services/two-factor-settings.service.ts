import api from "@/lib/api"
import type { ApiResponse } from "@/types"
import type {
  ConnectionTestResult,
  SaveTwoFactorPayload,
  TwoFactorSettings,
} from "@/types/integration-settings.types"

/** Talks to `/api/v1/admin/two-factor-settings` (2Factor.in SMS OTP). The API key is write-only. */
export const twoFactorSettingsService = {
  async get(): Promise<TwoFactorSettings> {
    const { data } = await api.get<ApiResponse<TwoFactorSettings>>(
      "/admin/two-factor-settings",
    )
    return data.data
  },

  /** Blank apiKey tests the saved key. */
  async test(apiKey?: string): Promise<ConnectionTestResult> {
    const { data } = await api.post<ApiResponse<ConnectionTestResult>>(
      "/admin/two-factor-settings/test",
      { apiKey },
    )
    return data.data
  },

  async save(
    payload: SaveTwoFactorPayload,
  ): Promise<{ settings: TwoFactorSettings; testResult: ConnectionTestResult | null }> {
    const { data } = await api.put<
      ApiResponse<{ settings: TwoFactorSettings; testResult: ConnectionTestResult | null }>
    >("/admin/two-factor-settings", payload)
    return data.data
  },

  async remove(): Promise<{ settings: TwoFactorSettings }> {
    const { data } = await api.delete<ApiResponse<{ settings: TwoFactorSettings }>>(
      "/admin/two-factor-settings",
    )
    return data.data
  },

  async sendTestOtp(phone: string): Promise<{ sent: boolean; phone: string; message: string }> {
    const { data } = await api.post<
      ApiResponse<{ sent: boolean; phone: string; message: string }>
    >("/admin/two-factor-settings/send-test-otp", { phone })
    return data.data
  },
}
