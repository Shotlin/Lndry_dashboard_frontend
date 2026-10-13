export type RazorpayMode = "TEST" | "LIVE"

export interface RazorpayModeSettings {
  configured: boolean
  keyId: string | null
  maskedSecret: string | null
  webhookConfigured: boolean
  lastTestedAt: string | null
  lastTestStatus: "SUCCESS" | "FAILED" | null
  lastTestMessage: string | null
}

export interface RazorpaySettings {
  activeMode: RazorpayMode
  effective: {
    mode: RazorpayMode | null
    source: "dashboard" | "env" | "none"
    keyId: string | null
  }
  webhookUrl: string
  pendingPayments: number
  test: RazorpayModeSettings
  live: RazorpayModeSettings
  updatedAt: string | null
}

export interface ConnectionTestResult {
  success: boolean
  statusCode?: number | null
  message: string
  balance?: string | null
}

export interface SaveRazorpayModePayload {
  keyId?: string
  keySecret?: string
  webhookSecret?: string
}

export interface TwoFactorSettings {
  configured: boolean
  isEnabled: boolean
  maskedKey: string | null
  template: string
  lastTestedAt: string | null
  lastTestStatus: "SUCCESS" | "FAILED" | null
  lastTestMessage: string | null
  lastBalance: string | null
  updatedAt: string | null
  effective: { source: "dashboard" | "env" | "none" }
}

export interface SaveTwoFactorPayload {
  apiKey?: string
  template?: string
  isEnabled?: boolean
}
