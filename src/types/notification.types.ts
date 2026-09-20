/* ── Notification Center types ──────────────────────
 * Mirrors the backend contract in Lndry_backend/src/utils/deeplink.js and
 * src/modules/admin/notifications/audience.js.
 */

export type LinkType =
  | "home"
  | "orders"
  | "order_details"
  | "vendor_details"
  | "offers"
  | "wallet"
  | "notifications"
  | "help"
  | "profile"
  | "refer_earn"
  | "rider_job"
  | "route"

export interface LinkParams {
  orderId?: string
  vendorId?: string
  route?: string
}

/** Where a tap on the notification should open. */
export interface DeepLink {
  type: LinkType
  params?: LinkParams
}

export type AudienceKind =
  | "ALL_CUSTOMERS"
  | "ALL_VENDORS"
  | "ALL_CAPTAINS"
  | "USER"
  | "VENDOR"
  | "VENDOR_CAPTAINS"
  | "SEGMENT"
  | "LOCATION"

export interface AudienceSpec {
  kind: AudienceKind
  userId?: string
  vendorId?: string
  segmentId?: string
  target?: "customers" | "vendors" | "captains"
  city?: string
  pincode?: string
}

export type CampaignStatus =
  | "DRAFT"
  | "QUEUED"
  | "SENDING"
  | "SENT"
  | "FAILED"
  | "SCHEDULED"
  | "CANCELLED"

export interface NotificationTemplate {
  id: string
  name: string
  title: string
  body: string
  type: "PUSH" | "SMS" | "EMAIL" | "IN_APP"
  variables: string[] | string | null
  image_url?: string | null
  deep_link?: string | null
  deep_link_type?: LinkType | null
  deep_link_params?: LinkParams | null
  is_active?: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface CreateTemplatePayload {
  name: string
  title: string
  body: string
  type?: "PUSH"
  image_url?: string
  deep_link_type?: LinkType
  deep_link_params?: LinkParams
}

export type UpdateTemplatePayload = Omit<Partial<CreateTemplatePayload>, "deep_link_type"> & {
  is_active?: boolean
  /** `null` clears the destination. */
  deep_link_type?: LinkType | null
}

export interface NotificationCampaign {
  id: string
  title: string
  body: string
  type?: string
  image_url?: string | null
  deep_link?: string | null
  deep_link_type?: LinkType | null
  deep_link_params?: LinkParams | null
  audience?: AudienceSpec | null
  target_app?: "customer" | "partner" | null
  target_count: number
  device_count: number
  sent_count: number
  opened_count: number | null
  failed_count: number | null
  open_rate: number
  failure_summary?: { reason?: string; invalidTokensDeactivated?: number } | null
  status: CampaignStatus
  template_id?: string | null
  scheduled_at?: string | null
  expires_at?: string | null
  sent_at?: string | null
  created_by: string
  created_by_name?: string
  created_at: string
  updated_at?: string
}

export interface CampaignDetail extends NotificationCampaign {
  breakdown: { app_type: string | null; status: string; count: number; opened: number }[]
  errors: { error_code: string | null; count: number }[]
}

export interface CreateCampaignPayload {
  title: string
  body: string
  image_url?: string
  link?: DeepLink | null
  audience: AudienceSpec
  expires_at?: string
  template_id?: string
  mode: "SEND_NOW" | "SCHEDULE" | "DRAFT"
  scheduledAt?: string
}

export interface AudienceCount {
  users: number
  devices: number
  customer_devices: number
  partner_devices: number
  android_devices: number
  ios_devices: number
}

export type RecipientType = "customer" | "vendor" | "captain" | "any"

export interface Recipient {
  id: string
  name: string | null
  phone?: string | null
  email?: string | null
  city?: string | null
  pincode?: string | null
  /** Devices currently registered for push (0 = cannot receive anything). */
  devices: number
}

export type TestStatus = "SENT" | "FAILED" | "INVALID_TOKEN" | "NO_DEVICE" | "NOT_CONFIGURED"

export interface TestSendResult {
  status: TestStatus
  user: { id: string; name: string | null; phone: string | null }
  devices: {
    app: string | null
    platform: string | null
    model: string | null
    status: "SENT" | "FAILED" | "INVALID_TOKEN"
    error: string | null
  }[]
}

export interface TestSendPayload {
  userId: string
  title?: string
  body?: string
  image_url?: string
  link?: DeepLink | null
}
