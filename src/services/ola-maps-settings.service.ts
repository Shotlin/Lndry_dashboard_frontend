import api from "@/lib/api"
import type { ApiResponse } from "@/types"
import type {
  OlaMapsSettings,
  OlaMapsTestResult,
  SaveOlaMapsSettingsPayload,
  SaveOlaMapsSettingsResult,
} from "@/types/ola-maps-settings.types"

/**
 * Ola Maps settings service — talks to `/api/v1/admin/ola-maps-settings`.
 * The raw API key never comes back from the server, only a masked
 * preview — `get()`/`save()` responses reflect that.
 */
export const olaMapsSettingsService = {
  async get(): Promise<OlaMapsSettings> {
    const { data } = await api.get<ApiResponse<OlaMapsSettings>>(
      "/admin/ola-maps-settings",
    )
    return data.data
  },

  /** Pings the live Ola Maps API with this key and reports the real result. */
  async test(apiKey: string): Promise<OlaMapsTestResult> {
    const { data } = await api.post<ApiResponse<OlaMapsTestResult>>(
      "/admin/ola-maps-settings/test",
      { apiKey },
    )
    return data.data
  },

  async save(
    payload: SaveOlaMapsSettingsPayload,
  ): Promise<SaveOlaMapsSettingsResult> {
    const { data } = await api.put<ApiResponse<SaveOlaMapsSettingsResult>>(
      "/admin/ola-maps-settings",
      payload,
    )
    return data.data
  },
}
