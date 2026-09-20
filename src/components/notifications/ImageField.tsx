"use client"

import { useRef, useState } from "react"
import { ImageIcon, Link2, Loader2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { uploadImage } from "@/services/uploads.service"
import { notificationErrorMessage } from "@/hooks/useNotifications"

const MAX_BYTES = 5 * 1024 * 1024

interface Props {
  value?: string | null
  onChange: (url: string | undefined) => void
}

/** Notification image: upload through the existing Cloudinary pipeline, or
 * paste an https link. Android/iOS download the picture themselves, so it
 * must be a public https URL either way. */
export function ImageField({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<"upload" | "link">("upload")
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [linkDraft, setLinkDraft] = useState("")

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    if (!file.type.startsWith("image/")) return setError("Choose an image file (JPG, PNG or WebP).")
    if (file.size > MAX_BYTES) return setError("The image is larger than 5 MB. Choose a smaller one.")
    setProgress(0)
    try {
      const res = await uploadImage(file, setProgress, "notifications")
      onChange(res.url)
    } catch (e) {
      setError(notificationErrorMessage(e, "The image could not be uploaded."))
    } finally {
      setProgress(null)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function applyLink() {
    const url = linkDraft.trim()
    if (!/^https:\/\/\S+$/i.test(url)) return setError("The link must start with https://")
    setError(null)
    onChange(url)
    setLinkDraft("")
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#e8e8ef] bg-[#fafafd] p-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Notification" className="h-16 w-24 rounded-lg object-cover bg-[#f1f1f5]" />
          <p className="min-w-0 flex-1 truncate text-[12px] text-[#64748b]">{value}</p>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChange(undefined)} aria-label="Remove image">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : mode === "upload" ? (
        <button
          type="button"
          disabled={progress !== null}
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#cbd5e1] bg-[#fafafd] px-4 py-5 text-[13px] font-semibold text-[#475569] transition-colors hover:border-[#6366F1] hover:text-[#6366F1] disabled:opacity-60"
        >
          {progress !== null ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Uploading… {progress}%</>
          ) : (
            <><Upload className="h-4 w-4" /> Upload image <span className="font-normal text-[#94a3b8]">(JPG, PNG, WebP · up to 5 MB)</span></>
          )}
        </button>
      ) : (
        <div className="flex gap-2">
          <Input
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyLink() } }}
            placeholder="https://example.com/banner.jpg"
            className="h-10 rounded-xl text-[13px]"
          />
          <Button type="button" variant="outline" className="rounded-xl" onClick={applyLink}>Use link</Button>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

      {!value && (
        <button
          type="button"
          onClick={() => { setMode(mode === "upload" ? "link" : "upload"); setError(null) }}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#6366F1] hover:underline"
        >
          {mode === "upload" ? <><Link2 className="h-3.5 w-3.5" /> Use an image link instead</> : <><ImageIcon className="h-3.5 w-3.5" /> Upload an image instead</>}
        </button>
      )}
      {error && <p className="text-[12px] text-[#B91C1C]">{error}</p>}
    </div>
  )
}
