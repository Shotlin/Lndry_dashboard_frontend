import api from "@/lib/api"
import type { ApiResponse } from "@/types"
import type {
  AudienceCount,
  AudienceSpec,
  CampaignDetail,
  CampaignStatus,
  CreateCampaignPayload,
  CreateTemplatePayload,
  NotificationCampaign,
  NotificationTemplate,
  Recipient,
  RecipientType,
  TestSendPayload,
  TestSendResult,
  UpdateTemplatePayload,
  LifecycleEvent,
  LifecycleLogRow,
  LifecycleLogStatus,
  SaveLifecyclePayload,
} from "@/types/notification.types"

const BASE = "/admin/notifications"

/* ── Templates ───────────────────────────────────── */

export async function getTemplates(): Promise<NotificationTemplate[]> {
  const { data } = await api.get<ApiResponse<NotificationTemplate[]>>(`${BASE}/templates`)
  return Array.isArray(data.data) ? data.data : []
}

export async function createTemplate(payload: CreateTemplatePayload): Promise<NotificationTemplate> {
  const { data } = await api.post<ApiResponse<NotificationTemplate>>(`${BASE}/templates`, payload)
  return data.data
}

export async function updateTemplate(id: string, payload: UpdateTemplatePayload): Promise<NotificationTemplate> {
  const { data } = await api.put<ApiResponse<NotificationTemplate>>(`${BASE}/templates/${id}`, payload)
  return data.data
}

export async function duplicateTemplate(id: string): Promise<NotificationTemplate> {
  const { data } = await api.post<ApiResponse<NotificationTemplate>>(`${BASE}/templates/${id}/duplicate`)
  return data.data
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`${BASE}/templates/${id}`)
}

/* ── Campaigns ───────────────────────────────────── */

export async function getCampaigns(
  page = 1,
  limit = 20,
  status?: CampaignStatus
): Promise<{ campaigns: NotificationCampaign[]; total: number }> {
  const { data } = await api.get<ApiResponse<{ campaigns: NotificationCampaign[]; total: number }>>(
    `${BASE}/campaigns`,
    { params: { page, limit, ...(status ? { status } : {}) } }
  )
  return data.data
}

export async function getCampaign(id: string): Promise<CampaignDetail> {
  const { data } = await api.get<ApiResponse<CampaignDetail>>(`${BASE}/campaigns/${id}`)
  return data.data
}

export async function createCampaign(payload: CreateCampaignPayload): Promise<NotificationCampaign> {
  const { data } = await api.post<ApiResponse<NotificationCampaign>>(`${BASE}/campaigns`, payload)
  return data.data
}

export async function updateDraft(
  id: string,
  payload: Partial<Omit<CreateCampaignPayload, "mode" | "scheduledAt">>
): Promise<NotificationCampaign> {
  const { data } = await api.put<ApiResponse<NotificationCampaign>>(`${BASE}/campaigns/${id}`, payload)
  return data.data
}

export async function sendDraft(
  id: string,
  payload: { mode: "SEND_NOW" | "SCHEDULE"; scheduledAt?: string }
): Promise<NotificationCampaign> {
  const { data } = await api.post<ApiResponse<NotificationCampaign>>(`${BASE}/campaigns/${id}/send`, payload)
  return data.data
}

export async function cancelCampaign(id: string): Promise<void> {
  await api.post(`${BASE}/campaigns/${id}/cancel`)
}

export async function deleteCampaign(id: string): Promise<void> {
  await api.delete(`${BASE}/campaigns/${id}`)
}

/* ── Audience / recipients / test ─────────────────── */

export async function countAudience(audience: AudienceSpec): Promise<AudienceCount> {
  const { data } = await api.post<ApiResponse<AudienceCount>>(`${BASE}/audience/count`, { audience })
  return data.data
}

export async function searchRecipients(q: string, type: RecipientType): Promise<Recipient[]> {
  const { data } = await api.get<ApiResponse<Recipient[]>>(`${BASE}/recipients/search`, { params: { q, type } })
  return Array.isArray(data.data) ? data.data : []
}

export async function sendTest(payload: TestSendPayload): Promise<TestSendResult> {
  const { data } = await api.post<ApiResponse<TestSendResult>>(`${BASE}/test`, payload)
  return data.data
}

/* ── Order lifecycle notifications ────────────────── */

const LIFECYCLE = "/admin/notification-lifecycle"

export async function getLifecycleEvents(): Promise<LifecycleEvent[]> {
  const { data } = await api.get<ApiResponse<LifecycleEvent[]>>(`${LIFECYCLE}/events`)
  return Array.isArray(data.data) ? data.data : []
}

export async function saveLifecycleEvent(eventKey: string, payload: SaveLifecyclePayload): Promise<LifecycleEvent> {
  const { data } = await api.put<ApiResponse<LifecycleEvent>>(`${LIFECYCLE}/events/${eventKey}`, payload)
  return data.data
}

export async function resetLifecycleEvent(eventKey: string): Promise<LifecycleEvent> {
  const { data } = await api.post<ApiResponse<LifecycleEvent>>(`${LIFECYCLE}/events/${eventKey}/reset`)
  return data.data
}

export async function testLifecycleEvent(
  eventKey: string,
  userId: string
): Promise<{ status: "SENT" | "FAILED" | "INVALID_TOKEN" | "NO_DEVICE" | "NOT_CONFIGURED"; devices: number; sent: number }> {
  const { data } = await api.post<
    ApiResponse<{ status: "SENT" | "FAILED" | "INVALID_TOKEN" | "NO_DEVICE" | "NOT_CONFIGURED"; devices: number; sent: number }>
  >(`${LIFECYCLE}/events/${eventKey}/test`, { userId })
  return data.data
}

export async function getLifecycleLog(params: {
  page: number
  limit: number
  event?: string
  status?: LifecycleLogStatus
  order?: string
}): Promise<{ events: LifecycleLogRow[]; total: number }> {
  const { data } = await api.get<ApiResponse<{ events: LifecycleLogRow[]; total: number }>>(`${LIFECYCLE}/log`, { params })
  return data.data
}
