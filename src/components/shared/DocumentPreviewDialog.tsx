"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getKycDocumentBlob } from "@/services/vendors.service"

interface DocumentPreviewDialogProps {
  documentId: string | null
  title?: string
  onOpenChange: (open: boolean) => void
}

// Replaces the old window.open(blobUrl) pattern with an in-app preview.
// Branches on the response's actual Content-Type (which the backend already
// sets correctly for both images and PDFs — see watermark.service.js's
// processKycPreview) rather than guessing from a file extension.
export function DocumentPreviewDialog({ documentId, title, onOpenChange }: DocumentPreviewDialogProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [contentType, setContentType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!documentId) return

    let cancelled = false
    let objectUrl: string | null = null
    setIsLoading(true)
    setError(null)

    getKycDocumentBlob(documentId)
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
        setContentType(blob.type || null)
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load document")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [documentId])

  function handleOpenChange(open: boolean) {
    if (!open) {
      setUrl(null)
      setContentType(null)
      setError(null)
    }
    onOpenChange(open)
  }

  const isPdf = contentType === "application/pdf"

  return (
    <Dialog open={!!documentId} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="capitalize">{title ?? "Document preview"}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 rounded-lg border bg-muted/20 flex items-center justify-center overflow-hidden">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading document…
            </div>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          {!isLoading && !error && url && (
            isPdf ? (
              <iframe src={url} title={title ?? "Document preview"} className="w-full h-full border-0" />
            ) : (
              <img src={url} alt={title ?? "Document preview"} className="max-w-full max-h-full object-contain" />
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
