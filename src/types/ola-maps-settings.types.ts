export interface OlaMapsSettings {
  configured: boolean
  isEnabled: boolean
  maskedKey: string | null
  lastTestedAt: string | null
  lastTestStatus: "SUCCESS" | "FAILED" | null
  lastTestMessage: string | null
  updatedAt: string | null
}

export interface OlaMapsTestResult {
  success: boolean
  statusCode: number | null
  message: string
}

export interface SaveOlaMapsSettingsPayload {
  apiKey?: string
  isEnabled?: boolean
}

export interface SaveOlaMapsSettingsResult {
  settings: OlaMapsSettings
  testResult: OlaMapsTestResult
}
