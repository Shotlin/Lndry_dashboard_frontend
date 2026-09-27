"use client"

import { Suspense, useState } from "react"
import { Download, Smartphone, Trash2, UploadCloud } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AppReleaseUploadDialog } from "@/components/app-releases/AppReleaseUploadDialog"
import { useAppReleases, useDeleteAppRelease } from "@/hooks/useAppReleases"
import { usePermissions } from "@/hooks/usePermissions"
import type { AppRelease, AppReleaseApp } from "@/types"

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/v1\/?$/, "")

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}

function AppReleaseCard({ app, appLabel }: { app: AppReleaseApp; appLabel: string }) {
  const { data: releases, isLoading } = useAppReleases(app)
  const deleteMutation = useDeleteAppRelease(app)
  const { can } = usePermissions()
  const canManage = can("settings.write")
  const [dialogOpen, setDialogOpen] = useState(false)

  const active = releases?.find((r) => r.isActive)
  const history = releases?.filter((r) => !r.isActive) ?? []
  const downloadUrl = `${API_BASE}/api/v1/app-releases/download/${app.toLowerCase()}`

  const handleDelete = (release: AppRelease) => {
    if (confirm(`Delete build v${release.versionName}? This can't be undone.`)) {
      deleteMutation.mutate(release.id)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF2FF]">
            <Smartphone className="h-4.5 w-4.5 text-[#6366F1]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{appLabel}</h3>
            <p className="text-xs text-muted-foreground">{app === "CUSTOMER" ? "com.lndry.app" : "Lndry Partner"}</p>
          </div>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <UploadCloud className="h-3.5 w-3.5 mr-1.5" /> Upload new build
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="mt-4"><LoadingSkeleton count={2} /></div>
      ) : active ? (
        <div className="mt-4 rounded-lg border bg-[#fafafd] p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">v{active.versionName}</span>
              <Badge variant="secondary" className="text-[10px]">code {active.versionCode}</Badge>
              <Badge className="text-[10px] bg-[#DCFCE7] text-[#166534] hover:bg-[#DCFCE7]">Live on website</Badge>
            </div>
            <a href={downloadUrl} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#6366F1] hover:underline">
              <Download className="h-3.5 w-3.5" /> {formatSize(active.fileSizeBytes)}
            </a>
          </div>
          <p className="mt-1.5 text-[12px] text-muted-foreground">
            Uploaded {formatDate(active.createdAt)}
          </p>
          {active.releaseNotes && (
            <p className="mt-2 text-[12px] text-[#475569] whitespace-pre-wrap">{active.releaseNotes}</p>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed p-4 text-center text-[12px] text-muted-foreground">
          No build uploaded yet — the website&apos;s download button will be hidden for {appLabel} until one is.
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Previous builds
          </p>
          <ul className="mt-2 space-y-1.5">
            {history.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-[12px] hover:bg-[#fafafd]">
                <span className="text-[#475569]">
                  v{r.versionName} <span className="text-muted-foreground">· {formatDate(r.createdAt)} · {formatSize(r.fileSizeBytes)}</span>
                </span>
                {canManage && (
                  <button
                    onClick={() => handleDelete(r)}
                    className="text-muted-foreground hover:text-[#B91C1C]"
                    aria-label={`Delete v${r.versionName}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <AppReleaseUploadDialog open={dialogOpen} onClose={() => setDialogOpen(false)} app={app} appLabel={appLabel} />
    </div>
  )
}

function AppReleasesContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="App Releases"
        subtitle="Self-hosted APK distribution — upload a build here and it's what the website's download buttons and the dashboard serve, before either app is live on Play Store"
      />
      <div className="grid gap-5 md:grid-cols-2">
        <AppReleaseCard app="CUSTOMER" appLabel="LNDRY (Customer app)" />
        <AppReleaseCard app="VENDOR" appLabel="Lndry Partner (Vendor app)" />
      </div>
    </div>
  )
}

export default function AppReleasesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton count={4} />}>
      <AppReleasesContent />
    </Suspense>
  )
}
