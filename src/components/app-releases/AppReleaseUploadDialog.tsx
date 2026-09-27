"use client"

import { useRef, useState } from "react"
import { Loader2, UploadCloud } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUploadAppRelease } from "@/hooks/useAppReleases"
import type { AppReleaseApp } from "@/types"

interface Props {
  open: boolean
  onClose: () => void
  app: AppReleaseApp
  appLabel: string
}

const INITIAL = { versionName: "", versionCode: "", releaseNotes: "" }

export function AppReleaseUploadDialog({ open, onClose, app, appLabel }: Props) {
  const [form, setForm] = useState(INITIAL)
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useUploadAppRelease(app)

  const reset = () => {
    setForm(INITIAL)
    setFile(null)
    setProgress(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleClose = () => {
    if (progress !== null) return // don't let the dialog close mid-upload
    reset()
    onClose()
  }

  const handleFile = (f: File | undefined) => {
    setError(null)
    if (!f) return setFile(null)
    if (!f.name.toLowerCase().endsWith(".apk")) {
      setError("Choose a .apk file")
      return
    }
    setFile(f)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!file) return setError("Choose an APK file to upload")
    if (!form.versionName.trim()) return setError("Version name is required (e.g. 1.0.3)")
    const versionCode = Number.parseInt(form.versionCode, 10)
    if (!Number.isFinite(versionCode) || versionCode <= 0) return setError("Version code must be a positive whole number")

    setProgress(0)
    uploadMutation.mutate(
      {
        params: {
          app,
          versionName: form.versionName.trim(),
          versionCode,
          releaseNotes: form.releaseNotes.trim() || undefined,
        },
        file,
        onProgress: setProgress,
      },
      {
        onSuccess: () => {
          reset()
          onClose()
        },
        onError: (err) => {
          setProgress(null)
          setError(appErrorMessage(err))
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload new {appLabel} build</DialogTitle>
            <DialogDescription>
              This becomes the version the website&apos;s download button and the
              dashboard serve immediately — the previous build stays in history,
              not deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="apk-file">APK file</Label>
              <button
                type="button"
                disabled={progress !== null}
                onClick={() => inputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#cbd5e1] bg-[#fafafd] px-4 py-5 text-[13px] font-semibold text-[#475569] transition-colors hover:border-[#6366F1] hover:text-[#6366F1] disabled:opacity-60"
              >
                {progress !== null ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading… {progress}%
                  </>
                ) : file ? (
                  <>
                    <UploadCloud className="h-4 w-4" /> {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" /> Choose .apk file
                  </>
                )}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".apk"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="versionName">Version name</Label>
                <Input
                  id="versionName"
                  placeholder="1.0.3"
                  value={form.versionName}
                  disabled={progress !== null}
                  onChange={(e) => setForm({ ...form, versionName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="versionCode">Version code</Label>
                <Input
                  id="versionCode"
                  type="number"
                  placeholder="11"
                  value={form.versionCode}
                  disabled={progress !== null}
                  onChange={(e) => setForm({ ...form, versionCode: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="releaseNotes">Release notes (optional)</Label>
              <Textarea
                id="releaseNotes"
                placeholder="What changed in this build"
                value={form.releaseNotes}
                disabled={progress !== null}
                onChange={(e) => setForm({ ...form, releaseNotes: e.target.value })}
                rows={3}
              />
            </div>

            {error && <p className="text-[12px] text-[#B91C1C]">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={progress !== null}>
              Cancel
            </Button>
            <Button type="submit" disabled={progress !== null}>
              {progress !== null ? "Uploading…" : "Upload & roll out"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function appErrorMessage(error: unknown): string {
  const resp = (error as { response?: { data?: { message?: string } } })?.response
  if (resp?.data?.message) return resp.data.message
  if (error instanceof Error) return error.message
  return "Upload failed"
}
