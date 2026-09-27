"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  listAppReleases,
  uploadAppRelease,
  deleteAppRelease,
} from "@/services/app-releases.service"
import type { AppReleaseApp, UploadAppReleaseParams } from "@/types"

export function appReleaseErrorMessage(error: unknown): string {
  const resp = (error as { response?: { data?: { message?: string } } })?.response
  if (resp?.data?.message) return resp.data.message
  if (error instanceof Error) return error.message
  return "Something went wrong"
}

function key(app: AppReleaseApp) {
  return ["app-releases", app]
}

export function useAppReleases(app: AppReleaseApp) {
  return useQuery({ queryKey: key(app), queryFn: () => listAppReleases(app) })
}

export function useUploadAppRelease(app: AppReleaseApp) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: {
      params: UploadAppReleaseParams
      file: File
      onProgress?: (progress: number) => void
    }) => uploadAppRelease(vars.params, vars.file, vars.onProgress),
    onSuccess: (release) => {
      toast.success(`${release.originalFileName} rolled out as the active build`)
      qc.invalidateQueries({ queryKey: key(app) })
    },
    onError: (err) => toast.error(appReleaseErrorMessage(err)),
  })
}

export function useDeleteAppRelease(app: AppReleaseApp) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAppRelease(id),
    onSuccess: () => {
      toast.success("Release deleted")
      qc.invalidateQueries({ queryKey: key(app) })
    },
    onError: (err) => toast.error(appReleaseErrorMessage(err)),
  })
}
