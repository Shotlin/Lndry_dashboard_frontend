"use client"

import React, { useEffect, useRef, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import "react-easy-crop/react-easy-crop.css"
import { Upload, X, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cropImageToFile } from "@/lib/image-crop"

interface ImageUploadProps {
  /** Currently saved URL (if editing an existing record). Ignored once the
   * user picks a new file or explicitly removes the image. */
  value?: string | null
  /** Fires with the (already-cropped) File when the user finishes cropping
   * a picked image, or `null` when they remove the image. Nothing is
   * uploaded here — the parent form uploads it (and deletes any old
   * asset) only when the user hits the form's own Save button, so
   * cancelled edits never leave orphaned Cloudinary files. */
  onFileSelected: (file: File | null) => void
  disabled?: boolean
  label?: string
  helperText?: React.ReactNode
  /** Crop aspect ratio (width / height). Defaults to `1` (square) so
   * existing callers are unaffected. Pass e.g. `1440 / 720` for a landscape
   * banner crop matching the backend's Cloudinary transform profile. */
  aspect?: number
}

export function ImageUpload({
  value,
  onFileSelected,
  disabled,
  label,
  helperText,
  aspect = 1,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  // Tracks an explicit removal so the box doesn't fall back to showing
  // `value` (the original saved image) again — without this, clicking X
  // looked like it did nothing because the old image just reappeared.
  const [removed, setRemoved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Crop step — shown between picking a file and it becoming the preview.
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropFileName, setCropFileName] = useState("image.jpg")
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isCropping, setIsCropping] = useState(false)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc)
    }
  }, [cropSrc])

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setCropFileName(file.name)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setCropSrc(URL.createObjectURL(file))
  }

  const closeCropModal = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  const confirmCrop = async () => {
    if (!cropSrc || !croppedAreaPixels) return
    setIsCropping(true)
    try {
      const croppedFile = await cropImageToFile(cropSrc, croppedAreaPixels, cropFileName, aspect)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(croppedFile))
      setRemoved(false)
      onFileSelected(croppedFile)
      closeCropModal()
    } finally {
      setIsCropping(false)
    }
  }

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setRemoved(true)
    onFileSelected(null)
  }

  const displayUrl = removed ? null : previewUrl ?? value

  // Preview box dimensions scale with `aspect` (width/height); defaults to
  // the original fixed 10rem×10rem square so existing callers are unaffected.
  const previewBoxStyle: React.CSSProperties =
    aspect === 1
      ? { width: "10rem", height: "10rem" }
      : aspect > 1
        ? { width: `${Math.min(10 * aspect, 24)}rem`, height: "10rem" }
        : { width: "10rem", height: `${Math.min(10 / aspect, 24)}rem` }

  return (
    <div className="space-y-2 w-full">
      {label && <span className="text-sm font-medium text-foreground">{label}</span>}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileSelected}
      />
      <div className="flex flex-col items-center justify-center">
        {displayUrl ? (
          <div className="relative rounded-xl overflow-hidden border" style={previewBoxStyle}>
            <img src={displayUrl} alt="Uploaded Image" className="w-full h-full object-cover" />
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="absolute bottom-2 left-2 bg-white/90 text-foreground rounded-full px-2 py-1 text-[11px] font-medium shadow hover:bg-white transition"
            >
              Replace
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-1 shadow hover:bg-rose-600 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={disabled ? undefined : () => inputRef.current?.click()}
            className="w-full h-40 border-2 border-dashed border-muted-foreground/30 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-500/50 hover:bg-muted/10 transition"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Choose an Image</span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {aspect === 1
          ? "Square image recommended (e.g. 800×800px). JPG, PNG or WebP, up to 5MB."
          : `Design your source image at exactly ${Math.round(720 * aspect)}×720px (${aspect.toFixed(2)}:1) so no cropping is needed — JPG, PNG or WebP, up to 5MB.`}
      </p>
      {helperText && <div className="text-xs text-muted-foreground">{helperText}</div>}

      <Dialog open={!!cropSrc} onOpenChange={(open) => !open && closeCropModal()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adjust Image</DialogTitle>
          </DialogHeader>
          {cropSrc && (
            <>
              <div className="relative w-full h-80 bg-muted rounded-lg overflow-hidden">
                <Cropper
                  image={cropSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect}
                  cropShape="rect"
                  showGrid
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-brand-500"
                />
              </div>
              {croppedAreaPixels && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  Selection: {Math.round(croppedAreaPixels.width)} ×{" "}
                  {Math.round(croppedAreaPixels.height)}px — nothing outside
                  this frame is saved.
                </p>
              )}
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeCropModal} disabled={isCropping}>
              Cancel
            </Button>
            <Button onClick={confirmCrop} disabled={isCropping || !croppedAreaPixels}>
              {isCropping ? "Applying..." : "Apply Crop"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
