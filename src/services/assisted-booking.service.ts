import api from "@/lib/api"
import type {
  ApiResponse,
  AssistedBookingSettings,
  UpdateAssistedBookingPayload,
} from "@/types"

export async function getAssistedBooking() {
  const { data } = await api.get<ApiResponse<AssistedBookingSettings>>("/admin/assisted-booking")
  return data.data
}

/** Returns what the backend actually stored, so the UI can show saved values. */
export async function updateAssistedBooking(payload: UpdateAssistedBookingPayload) {
  const { data } = await api.put<ApiResponse<AssistedBookingSettings>>("/admin/assisted-booking", payload)
  return data.data
}
