/** Self-hosted APK releases for the two Flutter apps — camelCase, as the backend returns them. */
export type AppReleaseApp = "CUSTOMER" | "VENDOR"

export interface AppRelease {
  id: string
  app: AppReleaseApp
  versionName: string
  versionCode: number
  releaseNotes: string | null
  fileName: string
  originalFileName: string
  fileSizeBytes: number
  sha256: string
  isActive: boolean
  uploadedBy: string | null
  createdAt: string
}

export interface UploadAppReleaseParams {
  app: AppReleaseApp
  versionName: string
  versionCode: number
  releaseNotes?: string
}
