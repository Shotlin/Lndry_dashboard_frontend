import api from "@/lib/api"
import type { ApiResponse } from "@/types"
import type {
  RiderAssignmentSettings,
  UpdateRiderAssignmentSettingsPayload,
} from "@/types/rider-assignment-settings.types"

/**
 * Rider Assignment Settings service — talks to
 * `/api/v1/admin/rider-assignment-settings`. Phase 5 of the
 * rider-assignment initiative (see CLAUDE.md).
 */
export const riderAssignmentSettingsService = {
  async get(): Promise<RiderAssignmentSettings> {
    const { data } = await api.get<ApiResponse<RiderAssignmentSettings>>(
      "/admin/rider-assignment-settings",
    )
    return data.data
  },

  async update(
    payload: UpdateRiderAssignmentSettingsPayload,
  ): Promise<RiderAssignmentSettings> {
    const { data } = await api.put<ApiResponse<RiderAssignmentSettings>>(
      "/admin/rider-assignment-settings",
      payload,
    )
    return data.data
  },
}
