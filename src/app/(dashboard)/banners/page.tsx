"use client"

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { EmptyState } from "@/components/shared/EmptyState"
import { ImageUpload } from "@/components/shared/ImageUpload"
import { PageHeader } from "@/components/shared/PageHeader"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useBanners,
  useCreateBanner,
  useDeleteBanner,
  useReorderBanners,
  useUpdateBanner,
} from "@/hooks/useBanners"
import { deleteImage, uploadImage } from "@/services/uploads.service"
import type { Banner } from "@/types"

/** Backend's Cloudinary 'banner' transform profile is 1440x720 (2:1 landscape). */
const BANNER_IMAGE_ASPECT = 1440 / 720

/**
 * Resolves the final image URL for a save action. Uploading only happens
 * here — at actual form-submit time — never on file pick, so a cancelled
 * dialog never leaves an orphaned Cloudinary asset. Returns `cleanupUrl`
 * when an old asset should be deleted after the entity save succeeds.
 */
async function resolveImage(
  pendingFile: File | null,
  removed: boolean,
  existingUrl: string | null | undefined,
  folder: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string | undefined; cleanupUrl?: string }> {
  if (pendingFile) {
    let uploaded
    try {
      uploaded = await uploadImage(pendingFile, onProgress, folder)
    } catch (err) {
      throw new Error("Image upload failed — check your connection and try again.", { cause: err })
    }
    return { url: uploaded.url, cleanupUrl: existingUrl || undefined }
  }
  if (removed) {
    return { url: "", cleanupUrl: existingUrl || undefined }
  }
  return { url: existingUrl || undefined }
}

type BannerForm = {
  title: string
  subtitle: string
  imageUrl: string
  bannerType: Banner["banner_type"]
  linkType: Banner["link_type"]
  linkValue: string
  isActive: boolean
  startDate: string
  endDate: string
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message
  }
  if (error instanceof Error) return error.message
  return "Something went wrong"
}

/** Converts an ISO datetime string to the `YYYY-MM-DDTHH:mm` shape the
 * native `<input type="datetime-local">` expects, in the browser's local
 * timezone (matching how the input displays/edits the value). */
function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Converts a datetime-local form value back to an ISO string for the API.
 * When the field is empty but previously had a value, returns `null` so the
 * update payload explicitly clears it (per backend contract); returns
 * `undefined` when there was nothing to clear, so partial-update semantics
 * leave the field untouched. */
function dateFieldForSubmit(value: string, wasSet: boolean): string | null | undefined {
  if (value) return new Date(value).toISOString()
  return wasSet ? null : undefined
}

function createInitialBannerForm(banner?: Banner | null): BannerForm {
  return {
    title: banner?.title ?? "",
    subtitle: banner?.subtitle ?? "",
    imageUrl: banner?.image_url ?? "",
    bannerType: banner?.banner_type ?? "carousel",
    linkType: banner?.link_type ?? "none",
    linkValue: banner?.link_value ?? "",
    isActive: banner?.is_active ?? true,
    startDate: toDatetimeLocalValue(banner?.start_date),
    endDate: toDatetimeLocalValue(banner?.end_date),
  }
}

function formatBannerType(type: Banner["banner_type"]) {
  if (type === "carousel") return "Carousel"
  if (type === "popup") return "Popup"
  return "Announcement"
}

export default function BannersPage() {
  const { data: bannersRaw, isLoading } = useBanners()
  const banners: Banner[] = Array.isArray(bannersRaw) ? bannersRaw : []
  const sortedBanners = useMemo(
    () => [...banners].sort((a, b) => a.sort_order - b.sort_order),
    [banners]
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null)
  const [form, setForm] = useState<BannerForm>(createInitialBannerForm())
  const [pendingImage, setPendingImage] = useState<File | null>(null)
  const [imageRemoved, setImageRemoved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  const createBanner = useCreateBanner()
  const updateBanner = useUpdateBanner()
  const deleteBanner = useDeleteBanner()
  const reorderBanners = useReorderBanners()

  const openCreateDialog = () => {
    setEditingBanner(null)
    setForm(createInitialBannerForm())
    setPendingImage(null)
    setImageRemoved(false)
    setDialogOpen(true)
  }

  const openEditDialog = (banner: Banner) => {
    setEditingBanner(banner)
    setForm(createInitialBannerForm(banner))
    setPendingImage(null)
    setImageRemoved(false)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingBanner(null)
    setForm(createInitialBannerForm())
    setPendingImage(null)
    setImageRemoved(false)
  }

  const moveBanner = (banner: Banner, direction: "up" | "down") => {
    const currentIndex = sortedBanners.findIndex((b) => b.id === banner.id)
    if (currentIndex === -1) return
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= sortedBanners.length) return

    const reordered = [...sortedBanners]
    const [moved] = reordered.splice(currentIndex, 1)
    reordered.splice(targetIndex, 0, moved)
    reorderBanners.mutate(reordered.map((b) => b.id))
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!editingBanner && !pendingImage) {
      toast.error("Banner image is required")
      return
    }
    if (form.linkType !== "none" && !form.linkValue.trim()) {
      toast.error("Link value is required when a link type is selected")
      return
    }

    setIsSaving(true)
    setUploadProgress(pendingImage ? 0 : null)
    try {
      const image = await resolveImage(
        pendingImage,
        imageRemoved,
        editingBanner?.image_url,
        "banners",
        pendingImage ? setUploadProgress : undefined
      )

      if (!image.url) {
        toast.error("Banner image is required")
        return
      }

      if (editingBanner) {
        await updateBanner.mutateAsync({
          id: editingBanner.id,
          payload: {
            title: form.title.trim(),
            subtitle: form.subtitle.trim() || undefined,
            imageUrl: image.url,
            bannerType: form.bannerType,
            linkType: form.linkType,
            linkValue: form.linkType !== "none" ? form.linkValue.trim() : undefined,
            isActive: form.isActive,
            startDate: dateFieldForSubmit(form.startDate, !!editingBanner.start_date),
            endDate: dateFieldForSubmit(form.endDate, !!editingBanner.end_date),
          },
        })
      } else {
        await createBanner.mutateAsync({
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || undefined,
          imageUrl: image.url,
          bannerType: form.bannerType,
          linkType: form.linkType,
          linkValue: form.linkType !== "none" ? form.linkValue.trim() : undefined,
          isActive: form.isActive,
          startDate: dateFieldForSubmit(form.startDate, false) ?? undefined,
          endDate: dateFieldForSubmit(form.endDate, false) ?? undefined,
        })
      }

      if (image.cleanupUrl) {
        deleteImage(image.cleanupUrl).catch(() => {
          // Best-effort — the banner save already succeeded either way.
        })
      }
      closeDialog()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSaving(false)
      setUploadProgress(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banners"
        subtitle="Carousel, popup and announcement banners shown in the customer app — reorder to control display priority."
      >
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Banner
        </Button>
      </PageHeader>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[96px]">Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[96px]">Order</TableHead>
              <TableHead className="w-[180px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 6 }).map((__, cell) => (
                    <TableCell key={cell}>
                      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : sortedBanners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState
                    title="No banners yet"
                    description="Add your first carousel, popup, or announcement banner."
                  />
                </TableCell>
              </TableRow>
            ) : (
              sortedBanners.map((banner, index) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    {banner.image_url ? (
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="h-10 w-16 rounded-md object-cover border shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-16 rounded-md bg-muted shrink-0" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>{banner.title}</div>
                    {banner.subtitle && (
                      <div className="text-xs text-muted-foreground">{banner.subtitle}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatBannerType(banner.banner_type)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={banner.is_active ? "default" : "secondary"}>
                      {banner.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === 0 || reorderBanners.isPending}
                        onClick={() => moveBanner(banner, "up")}
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === sortedBanners.length - 1 || reorderBanners.isPending}
                        onClick={() => moveBanner(banner, "down")}
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(banner)}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeleteTarget(banner)}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Edit Banner" : "Add Banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="banner-title">Title</Label>
              <Input
                id="banner-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Monsoon Wash Sale"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banner-subtitle">Subtitle</Label>
              <Input
                id="banner-subtitle"
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                placeholder="Optional supporting text"
              />
            </div>
            <ImageUpload
              label="Banner Image"
              value={form.imageUrl}
              aspect={BANNER_IMAGE_ASPECT}
              onFileSelected={(file) => {
                setPendingImage(file)
                setImageRemoved(file === null)
              }}
              helperText="Shown in the customer app carousel/popup. Only uploaded when you save."
            />
            {uploadProgress !== null && (
              <div className="space-y-1">
                <Progress value={uploadProgress} />
                <p className="text-xs text-muted-foreground">
                  Uploading image to Cloudinary... {uploadProgress}%
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Banner Type</Label>
                <Select
                  value={form.bannerType}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, bannerType: v as Banner["banner_type"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carousel">Carousel</SelectItem>
                    <SelectItem value="popup">Popup</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Link Type</Label>
                <Select
                  value={form.linkType}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      linkType: v as Banner["link_type"],
                      linkValue: v === "none" ? "" : f.linkValue,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.linkType !== "none" && (
              <div className="space-y-2">
                <Label htmlFor="banner-link-value">
                  {form.linkType === "category"
                    ? "Category ID"
                    : form.linkType === "product"
                      ? "Product ID"
                      : "URL"}
                </Label>
                <Input
                  id="banner-link-value"
                  value={form.linkValue}
                  onChange={(e) => setForm((f) => ({ ...f, linkValue: e.target.value }))}
                  placeholder={form.linkType === "url" ? "https://..." : "Target ID"}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="banner-start-date">Start Date (optional)</Label>
                <Input
                  id="banner-start-date"
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banner-end-date">End Date (optional)</Label>
                <Input
                  id="banner-end-date"
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
            {editingBanner && (
              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">
                    Inactive banners are hidden from the customer app.
                  </p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingBanner ? "Save Changes" : "Create Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the banner. It will no longer appear in the customer app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return
                deleteBanner.mutate(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
