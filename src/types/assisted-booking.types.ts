/** Assisted booking ("Book With Expert Check") settings — camelCase, as the backend returns them. */
export type AssistedBookingScope = "ALL" | "SELECTED"

export interface AssistedBookingVendor {
  id: string
  name: string
}

export interface AssistedBookingSettings {
  enabled: boolean
  scope: AssistedBookingScope
  title: string
  subtitle: string
  buttonText: string
  iconUrl: string | null
  checkoutNote: string
  assessmentTitle: string
  assessmentMessage: string
  priceLabel: string
  updatedAt?: string | null
  selectedVendors: AssistedBookingVendor[]
}

export interface UpdateAssistedBookingPayload {
  enabled?: boolean
  scope?: AssistedBookingScope
  title?: string
  subtitle?: string
  buttonText?: string
  iconUrl?: string | null
  checkoutNote?: string
  assessmentTitle?: string
  assessmentMessage?: string
  priceLabel?: string
  /** Replaces the selected vendors (only used when scope is SELECTED). */
  vendorIds?: string[]
}
