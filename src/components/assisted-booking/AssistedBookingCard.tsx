"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ImageIcon, Loader2, Save, Search, Sparkles, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  assistedBookingErrorMessage,
  useAssistedBooking,
  useUpdateAssistedBooking,
} from "@/hooks/useAssistedBooking"
import { useDebounce } from "@/hooks/useDebounce"
import { usePermissions } from "@/hooks/usePermissions"
import { getVendorsList } from "@/services/vendors.service"
import { uploadImage } from "@/services/uploads.service"
import type { AssistedBookingScope, AssistedBookingVendor } from "@/types"

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

interface Draft {
  enabled: boolean
  scope: AssistedBookingScope
  title: string
  subtitle: string
  buttonText: string
  iconUrl: string | null
  checkoutNote: string
  assessmentTitle: string
  assessmentMessage: string
  priceLabel: string
  vendors: AssistedBookingVendor[]
}

/**
 * Admin control for "Book With Expert Check" (assisted booking): on/off,
 * the wording customers see, an optional picture, and whether it is offered
 * to every vendor or only the ones picked here. Everything is stored on the
 * backend — the customer app reads it live, so wording changes need no app
 * release.
 */
export function AssistedBookingCard() {
  const { data, isLoading, isError } = useAssistedBooking()
  const update = useUpdateAssistedBooking()
  const { can } = usePermissions()
  const canEdit = can("settings.write")

  const [draft, setDraft] = useState<Draft | null>(null)
  const [uploading, setUploading] = useState(false)
  const [vendorSearch, setVendorSearch] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!data) return
    setDraft({
      enabled: data.enabled,
      scope: data.scope,
      title: data.title,
      subtitle: data.subtitle,
      buttonText: data.buttonText,
      iconUrl: data.iconUrl,
      checkoutNote: data.checkoutNote,
      assessmentTitle: data.assessmentTitle,
      assessmentMessage: data.assessmentMessage,
      priceLabel: data.priceLabel,
      vendors: data.selectedVendors,
    })
  }, [data])

  const debouncedSearch = useDebounce(vendorSearch, 300)
  const { data: searchResult, isFetching: searching } = useQuery({
    queryKey: ["assisted-booking-vendor-search", debouncedSearch],
    queryFn: () => getVendorsList({ search: debouncedSearch || undefined, status: "APPROVED", limit: 8 }),
    enabled: draft?.scope === "SELECTED",
    staleTime: 30_000,
  })

  const selectedIds = useMemo(() => new Set(draft?.vendors.map((v) => v.id)), [draft?.vendors])

  if (isLoading || (!draft && !isError)) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }
  if (isError || !draft) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Assisted booking settings could not be loaded. Refresh the page to try again.
        </CardContent>
      </Card>
    )
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d))

  async function onPickImage(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file (JPG, PNG or WebP).")
    if (file.size > MAX_IMAGE_BYTES) return toast.error("The image is larger than 5 MB.")
    setUploading(true)
    try {
      const res = await uploadImage(file, undefined, "assisted-booking")
      set("iconUrl", res.url)
    } catch (e) {
      toast.error(assistedBookingErrorMessage(e))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  function toggleVendor(vendor: AssistedBookingVendor) {
    setDraft((d) => {
      if (!d) return d
      const has = d.vendors.some((v) => v.id === vendor.id)
      return { ...d, vendors: has ? d.vendors.filter((v) => v.id !== vendor.id) : [...d.vendors, vendor] }
    })
  }

  function save() {
    if (!draft) return
    const required: Array<[string, string]> = [
      [draft.title, "Display title"],
      [draft.subtitle, "Display subtitle"],
      [draft.buttonText, "Button text"],
      [draft.checkoutNote, "Checkout note"],
      [draft.assessmentTitle, "Assessment title"],
      [draft.assessmentMessage, "Assessment message"],
      [draft.priceLabel, "Price placeholder"],
    ]
    const missing = required.find(([value]) => !value.trim())
    if (missing) return toast.error(`${missing[1]} cannot be empty`)
    if (draft.enabled && draft.scope === "SELECTED" && draft.vendors.length === 0) {
      return toast.error("Select at least one vendor, or make it available to all vendors")
    }
    update.mutate({
      enabled: draft.enabled,
      scope: draft.scope,
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      buttonText: draft.buttonText.trim(),
      iconUrl: draft.iconUrl,
      checkoutNote: draft.checkoutNote.trim(),
      assessmentTitle: draft.assessmentTitle.trim(),
      assessmentMessage: draft.assessmentMessage.trim(),
      priceLabel: draft.priceLabel.trim(),
      vendorIds: draft.scope === "SELECTED" ? draft.vendors.map((v) => v.id) : undefined,
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Assisted Booking — “Book With Expert Check”
              <Badge variant={draft.enabled ? "default" : "secondary"}>{draft.enabled ? "On" : "Off"}</Badge>
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl">
              For customers who don&apos;t know which service to pick. They book a pickup and pay the
              normal advance; the laundry inspects the garments, chooses the services through
              Re-evaluate, and the customer approves the final price. Shown on the vendor page in
              the customer app.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="assisted-enabled" className="text-sm">
              Enable Assisted Booking
            </Label>
            <Switch
              id="assisted-enabled"
              checked={draft.enabled}
              onCheckedChange={(v) => set("enabled", v)}
              disabled={!canEdit}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Availability */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Where it is offered</h3>
          <div className="max-w-xs">
            <Select value={draft.scope} onValueChange={(v) => set("scope", v as AssistedBookingScope)} disabled={!canEdit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All vendors (global)</SelectItem>
                <SelectItem value="SELECTED">Selected vendors only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {draft.scope === "SELECTED" && (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex flex-wrap gap-2">
                {draft.vendors.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No vendors selected yet.</p>
                ) : (
                  draft.vendors.map((v) => (
                    <Badge key={v.id} variant="secondary" className="gap-1 pr-1">
                      {v.name}
                      {canEdit && (
                        <button
                          type="button"
                          aria-label={`Remove ${v.name}`}
                          className="rounded p-0.5 hover:bg-background"
                          onClick={() => toggleVendor(v)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))
                )}
              </div>
              {canEdit && (
                <>
                  <div className="relative max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={vendorSearch}
                      onChange={(e) => setVendorSearch(e.target.value)}
                      placeholder="Search approved vendors…"
                      className="pl-8"
                    />
                  </div>
                  <div className="max-h-48 divide-y overflow-auto rounded-md border">
                    {searching && <p className="p-3 text-xs text-muted-foreground">Searching…</p>}
                    {!searching && (searchResult?.vendors ?? []).length === 0 && (
                      <p className="p-3 text-xs text-muted-foreground">No matching vendors.</p>
                    )}
                    {(searchResult?.vendors ?? []).map((v) => (
                      <label key={v.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(v.id)}
                          onChange={() => toggleVendor({ id: v.id, name: v.name })}
                        />
                        <span className="flex-1 truncate">{v.name}</span>
                        <span className="text-xs text-muted-foreground">{v.city}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {/* Wording */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">What customers see</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ab-title">Display title</Label>
              <Input id="ab-title" value={draft.title} onChange={(e) => set("title", e.target.value)} disabled={!canEdit} maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ab-button">Button text</Label>
              <Input id="ab-button" value={draft.buttonText} onChange={(e) => set("buttonText", e.target.value)} disabled={!canEdit} maxLength={60} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="ab-subtitle">Display subtitle</Label>
              <Textarea id="ab-subtitle" rows={2} value={draft.subtitle} onChange={(e) => set("subtitle", e.target.value)} disabled={!canEdit} maxLength={300} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="ab-checkout">Checkout note</Label>
              <Input id="ab-checkout" value={draft.checkoutNote} onChange={(e) => set("checkoutNote", e.target.value)} disabled={!canEdit} maxLength={300} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ab-atitle">Order / cart heading</Label>
              <Input id="ab-atitle" value={draft.assessmentTitle} onChange={(e) => set("assessmentTitle", e.target.value)} disabled={!canEdit} maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ab-price">Price placeholder</Label>
              <Input id="ab-price" value={draft.priceLabel} onChange={(e) => set("priceLabel", e.target.value)} disabled={!canEdit} maxLength={80} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="ab-amsg">Order / cart message</Label>
              <Textarea id="ab-amsg" rows={2} value={draft.assessmentMessage} onChange={(e) => set("assessmentMessage", e.target.value)} disabled={!canEdit} maxLength={400} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon / image (optional)</Label>
            <div className="flex items-center gap-3">
              {draft.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.iconUrl} alt="Assisted booking icon" className="h-14 w-14 rounded-lg border object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                  <ImageIcon className="h-5 w-5" />
                </div>
              )}
              {canEdit && (
                <>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPickImage(e.target.files?.[0])} />
                  <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                    {uploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-1.5 h-4 w-4" />}
                    {draft.iconUrl ? "Change image" : "Upload image"}
                  </Button>
                  {draft.iconUrl && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => set("iconUrl", null)}>
                      Remove
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Live preview of the card on the vendor page */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Preview (vendor page)</h3>
          <div className="flex max-w-md items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            {draft.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.iconUrl} alt="" className="h-11 w-11 rounded-xl object-cover" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-bold">{draft.title || "—"}</p>
              <p className="text-xs text-muted-foreground">{draft.subtitle || "—"}</p>
              <span className="mt-1 inline-block rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground">
                {draft.buttonText || "—"}
              </span>
            </div>
          </div>
        </section>

        {canEdit && (
          <Button onClick={save} disabled={update.isPending || uploading}>
            {update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save assisted booking settings
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
