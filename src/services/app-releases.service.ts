import api from "@/lib/api"
import type { ApiResponse, AppRelease, AppReleaseApp, UploadAppReleaseParams } from "@/types"

export async function listAppReleases(app: AppReleaseApp) {
  const { data } = await api.get<ApiResponse<AppRelease[]>>("/admin/app-releases", {
    params: { app },
  })
  return data.data
}

/** Field order in the FormData matters: the backend's multipart parser only
 * sees form fields that arrived BEFORE the file part in the stream, so
 * `file` must be appended last (same rule as the existing image-upload
 * service). Large APKs (70-120MB) also need far more than the dashboard's
 * default 15s axios timeout. */
export async function uploadAppRelease(
  params: UploadAppReleaseParams,
  file: File,
  onProgress?: (progress: number) => void
) {
  const formData = new FormData()
  formData.append("app", params.app)
  formData.append("versionName", params.versionName)
  formData.append("versionCode", String(params.versionCode))
  if (params.releaseNotes) formData.append("releaseNotes", params.releaseNotes)
  formData.append("file", file)

  const { data } = await api.post<ApiResponse<AppRelease>>("/admin/app-releases", formData, {
    timeout: 10 * 60 * 1000,
    onUploadProgress: (event) => {
      if (!onProgress) return
      const total = event.total ?? file.size
      onProgress(total ? Math.round((event.loaded / total) * 100) : 0)
    },
  })
  return data.data
}

export async function deleteAppRelease(id: string) {
  const { data } = await api.delete<ApiResponse<null>>(`/admin/app-releases/${id}`)
  return data.data
}
