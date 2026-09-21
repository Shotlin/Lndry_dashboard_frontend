"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
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
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/useCategories"
import {
  garmentTypesService,
  type CreateGarmentTypePayload,
  type GarmentTypeAdmin,
  type UpdateGarmentTypePayload,
} from "@/services/garment-types.service"
import { deleteImage, uploadImage } from "@/services/uploads.service"
import { AssistedBookingCard } from "@/components/assisted-booking/AssistedBookingCard"
import type { Category } from "@/types"

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

type CategoryForm = {
  name: string
  description: string
  imageUrl: string
  isActive: boolean
}

type GarmentTypeForm = {
  name: string
  categoryId: string
  unit: "kg" | "piece"
  costPrice: string
  thumbnailUrl: string
  isActive: boolean
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

function createInitialCategoryForm(category?: Category | null): CategoryForm {
  return {
    name: category?.name ?? "",
    description: category?.description ?? "",
    imageUrl: category?.image_url ?? "",
    isActive: category?.is_active ?? true,
  }
}

function createInitialGarmentTypeForm(
  defaultCategoryId: string,
  garmentType?: GarmentTypeAdmin | null
): GarmentTypeForm {
  return {
    name: garmentType?.name ?? "",
    categoryId: garmentType?.category_id ?? defaultCategoryId,
    unit: (garmentType?.unit === "kg" ? "kg" : "piece") as "kg" | "piece",
    costPrice: garmentType?.cost_price != null ? String(garmentType.cost_price) : "",
    thumbnailUrl: garmentType?.thumbnail_url ?? "",
    isActive: garmentType?.is_active ?? true,
  }
}

export default function LaundryCategoriesPage() {
  const queryClient = useQueryClient()

  // ---- Categories ----
  const { data: categoriesRaw, isLoading: catLoading } = useCategories()
  const categories: Category[] = Array.isArray(categoriesRaw) ? categoriesRaw : []

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(createInitialCategoryForm())
  const [pendingCategoryImage, setPendingCategoryImage] = useState<File | null>(null)
  const [categoryImageRemoved, setCategoryImageRemoved] = useState(false)
  const [isSavingCategoryImage, setIsSavingCategoryImage] = useState(false)
  const [categoryUploadProgress, setCategoryUploadProgress] = useState<number | null>(null)

  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const openCreateCategoryDialog = () => {
    setEditingCategory(null)
    setCategoryForm(createInitialCategoryForm())
    setPendingCategoryImage(null)
    setCategoryImageRemoved(false)
    setCategoryDialogOpen(true)
  }

  const openEditCategoryDialog = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm(createInitialCategoryForm(category))
    setPendingCategoryImage(null)
    setCategoryImageRemoved(false)
    setCategoryDialogOpen(true)
  }

  const closeCategoryDialog = () => {
    setCategoryDialogOpen(false)
    setEditingCategory(null)
    setCategoryForm(createInitialCategoryForm())
    setPendingCategoryImage(null)
    setCategoryImageRemoved(false)
  }

  const handleCategorySubmit = async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required")
      return
    }

    setIsSavingCategoryImage(true)
    setCategoryUploadProgress(pendingCategoryImage ? 0 : null)
    try {
      const image = await resolveImage(
        pendingCategoryImage,
        categoryImageRemoved,
        editingCategory?.image_url,
        "categories",
        pendingCategoryImage ? setCategoryUploadProgress : undefined
      )

      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          payload: {
            name: categoryForm.name.trim(),
            description: categoryForm.description.trim() || undefined,
            image_url: image.url,
            is_active: categoryForm.isActive,
          },
        })
      } else {
        await createCategory.mutateAsync({
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || undefined,
          image_url: image.url,
        })
      }

      if (image.cleanupUrl) {
        deleteImage(image.cleanupUrl).catch(() => {
          // Best-effort — the category save already succeeded either way.
        })
      }
      toast.success(
        pendingCategoryImage ? "Category saved — image uploaded to Cloudinary" : "Category saved"
      )
      closeCategoryDialog()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSavingCategoryImage(false)
      setCategoryUploadProgress(null)
    }
  }

  // ---- Subcategories (garment types) ----
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")

  useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      const laundryServices = categories.find((c) => c.slug === "laundry-services")
      setSelectedCategoryId((laundryServices ?? categories[0]).id)
    }
  }, [categories, selectedCategoryId])

  const { data: garmentTypes = [], isLoading: gtLoading } = useQuery({
    queryKey: ["admin", "garment-types", selectedCategoryId],
    queryFn: () => garmentTypesService.getAll(selectedCategoryId),
    enabled: !!selectedCategoryId,
    staleTime: 30_000,
  })

  const refreshGarmentTypes = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "garment-types", selectedCategoryId] })

  const [gtDialogOpen, setGtDialogOpen] = useState(false)
  const [editingGarmentType, setEditingGarmentType] = useState<GarmentTypeAdmin | null>(null)
  const [deleteGarmentTypeTarget, setDeleteGarmentTypeTarget] = useState<GarmentTypeAdmin | null>(null)
  const [gtForm, setGtForm] = useState<GarmentTypeForm>(createInitialGarmentTypeForm(""))
  const [pendingGtImage, setPendingGtImage] = useState<File | null>(null)
  const [gtImageRemoved, setGtImageRemoved] = useState(false)
  const [isSavingGtImage, setIsSavingGtImage] = useState(false)
  const [gtUploadProgress, setGtUploadProgress] = useState<number | null>(null)

  const createGarmentType = useMutation({
    mutationFn: (payload: CreateGarmentTypePayload) => garmentTypesService.create(payload),
  })

  const updateGarmentType = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateGarmentTypePayload }) =>
      garmentTypesService.update(id, payload),
  })

  const deleteGarmentType = useMutation({
    mutationFn: (id: string) => garmentTypesService.delete(id),
    onSuccess: () => {
      toast.success("Subcategory deleted")
      setDeleteGarmentTypeTarget(null)
      refreshGarmentTypes()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
      setDeleteGarmentTypeTarget(null)
    },
  })

  const openCreateGtDialog = () => {
    setEditingGarmentType(null)
    setGtForm(createInitialGarmentTypeForm(selectedCategoryId))
    setPendingGtImage(null)
    setGtImageRemoved(false)
    setGtDialogOpen(true)
  }

  const openEditGtDialog = (garmentType: GarmentTypeAdmin) => {
    setEditingGarmentType(garmentType)
    setGtForm(createInitialGarmentTypeForm(selectedCategoryId, garmentType))
    setPendingGtImage(null)
    setGtImageRemoved(false)
    setGtDialogOpen(true)
  }

  const closeGtDialog = () => {
    setGtDialogOpen(false)
    setEditingGarmentType(null)
    setGtForm(createInitialGarmentTypeForm(selectedCategoryId))
    setPendingGtImage(null)
    setGtImageRemoved(false)
  }

  const handleGtSubmit = async () => {
    if (!gtForm.name.trim()) {
      toast.error("Subcategory name is required")
      return
    }
    if (!gtForm.categoryId) {
      toast.error("Pick a category")
      return
    }
    const costPrice = gtForm.costPrice.trim() === "" ? undefined : Number(gtForm.costPrice)
    if (costPrice !== undefined && (!Number.isFinite(costPrice) || costPrice < 0)) {
      toast.error("Demo price must be a positive number")
      return
    }

    setIsSavingGtImage(true)
    setGtUploadProgress(pendingGtImage ? 0 : null)
    try {
      const image = await resolveImage(
        pendingGtImage,
        gtImageRemoved,
        editingGarmentType?.thumbnail_url,
        "garment-types",
        pendingGtImage ? setGtUploadProgress : undefined
      )

      if (editingGarmentType) {
        await updateGarmentType.mutateAsync({
          id: editingGarmentType.id,
          payload: {
            name: gtForm.name.trim(),
            categoryId: gtForm.categoryId,
            unit: gtForm.unit,
            costPrice,
            thumbnailUrl: image.url,
            isActive: gtForm.isActive,
          },
        })
        toast.success(
          pendingGtImage ? "Subcategory updated — image uploaded to Cloudinary" : "Subcategory updated"
        )
      } else {
        await createGarmentType.mutateAsync({
          name: gtForm.name.trim(),
          categoryId: gtForm.categoryId,
          unit: gtForm.unit,
          costPrice,
          thumbnailUrl: image.url,
        })
        toast.success(
          pendingGtImage ? "Subcategory added — image uploaded to Cloudinary" : "Subcategory added"
        )
      }

      if (image.cleanupUrl) {
        deleteImage(image.cleanupUrl).catch(() => {
          // Best-effort — the subcategory save already succeeded either way.
        })
      }
      refreshGarmentTypes()
      closeGtDialog()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSavingGtImage(false)
      setGtUploadProgress(null)
    }
  }

  const selectedCategoryName = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId)?.name ?? "",
    [categories, selectedCategoryId]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories & Subcategories"
        subtitle="Admin-curated service catalogue — vendors can only choose from what's published here and set their own prices."
      >
        <Button size="sm" onClick={openCreateCategoryDialog}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Category
        </Button>
      </PageHeader>

      {/* Categories table */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[180px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {catLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 4 }).map((__, cell) => (
                    <TableCell key={cell}>
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <EmptyState title="No categories yet" description="Add your first category to get started." />
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2.5">
                      {category.image_url ? (
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="h-8 w-8 rounded-md object-cover border shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-md bg-muted shrink-0" />
                      )}
                      {category.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.description || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditCategoryDialog(category)}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeleteCategoryTarget(category)}
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

      {/* Subcategories */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[15px] font-bold">Subcategories</h2>
            <p className="text-[12px] text-muted-foreground">
              What a vendor can activate under {selectedCategoryName || "a category"} and set their own price for.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Choose category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={openCreateGtDialog} disabled={!selectedCategoryId}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Subcategory
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Demo Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[180px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gtLoading ? (
                Array.from({ length: 2 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 5 }).map((__, cell) => (
                      <TableCell key={cell}>
                        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : garmentTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyState
                      title="No subcategories yet"
                      description="Add the items vendors can offer under this category."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                garmentTypes.map((gt) => (
                  <TableRow key={gt.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2.5">
                        {gt.thumbnail_url ? (
                          <img
                            src={gt.thumbnail_url}
                            alt={gt.name}
                            className="h-8 w-8 rounded-md object-cover border shrink-0"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-md bg-muted shrink-0" />
                        )}
                        {gt.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{gt.unit}</TableCell>
                    <TableCell>{gt.cost_price != null ? `₹${gt.cost_price}` : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={gt.is_active ? "default" : "secondary"}>
                        {gt.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditGtDialog(gt)}>
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeleteGarmentTypeTarget(gt)}
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
      </div>

      {/* Assisted booking ("Book With Expert Check") — on/off, wording, vendors */}
      <AssistedBookingCard />

      {/* Category create/edit dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={(open) => (open ? setCategoryDialogOpen(true) : closeCategoryDialog())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Laundry Services"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Description</Label>
              <Input
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <ImageUpload
              label="Category Image"
              value={categoryForm.imageUrl}
              onFileSelected={(file) => {
                setPendingCategoryImage(file)
                setCategoryImageRemoved(file === null)
              }}
              helperText="Shown to vendors when picking a category. Only uploaded when you save."
            />
            {categoryUploadProgress !== null && (
              <div className="space-y-1">
                <Progress value={categoryUploadProgress} />
                <p className="text-xs text-muted-foreground">
                  Uploading image to Cloudinary... {categoryUploadProgress}%
                </p>
              </div>
            )}
            {editingCategory && (
              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Vendors only see active categories.</p>
                </div>
                <Switch
                  checked={categoryForm.isActive}
                  onCheckedChange={(checked) => setCategoryForm((f) => ({ ...f, isActive: checked }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCategoryDialog}>
              Cancel
            </Button>
            <Button onClick={handleCategorySubmit} disabled={isSavingCategoryImage}>
              {isSavingCategoryImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category delete confirmation — this is a soft delete (is_active=false) server-side */}
      <AlertDialog open={!!deleteCategoryTarget} onOpenChange={(open) => !open && setDeleteCategoryTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate &quot;{deleteCategoryTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This deactivates the category — it disappears from the vendor app immediately, along with its
              subcategories. It isn&apos;t permanently deleted and can be reactivated later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteCategoryTarget) return
                deleteCategory.mutate(deleteCategoryTarget.id)
                setDeleteCategoryTarget(null)
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Subcategory create/edit dialog */}
      <Dialog open={gtDialogOpen} onOpenChange={(open) => (open ? setGtDialogOpen(true) : closeGtDialog())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGarmentType ? "Edit Subcategory" : "Add Subcategory"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="gt-name">Name</Label>
              <Input
                id="gt-name"
                value={gtForm.name}
                onChange={(e) => setGtForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Wash & Fold"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={gtForm.categoryId} onValueChange={(v) => setGtForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={gtForm.unit}
                  onValueChange={(v) => setGtForm((f) => ({ ...f, unit: v as "kg" | "piece" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="piece">piece</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gt-price">Demo Price (₹)</Label>
                <Input
                  id="gt-price"
                  type="number"
                  min={0}
                  value={gtForm.costPrice}
                  onChange={(e) => setGtForm((f) => ({ ...f, costPrice: e.target.value }))}
                  placeholder="e.g. 80"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              This is just a reference price shown to vendors — each vendor sets their own actual price.
            </p>
            <ImageUpload
              label="Subcategory Image"
              value={gtForm.thumbnailUrl}
              onFileSelected={(file) => {
                setPendingGtImage(file)
                setGtImageRemoved(file === null)
              }}
              helperText="Shown to vendors when picking subcategories to offer. Only uploaded when you save."
            />
            {gtUploadProgress !== null && (
              <div className="space-y-1">
                <Progress value={gtUploadProgress} />
                <p className="text-xs text-muted-foreground">
                  Uploading image to Cloudinary... {gtUploadProgress}%
                </p>
              </div>
            )}
            {editingGarmentType && (
              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Vendors only see active subcategories.</p>
                </div>
                <Switch
                  checked={gtForm.isActive}
                  onCheckedChange={(checked) => setGtForm((f) => ({ ...f, isActive: checked }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeGtDialog}>
              Cancel
            </Button>
            <Button onClick={handleGtSubmit} disabled={isSavingGtImage}>
              {isSavingGtImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingGarmentType ? "Save Changes" : "Create Subcategory"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subcategory delete confirmation — this IS a hard, permanent delete server-side */}
      <AlertDialog
        open={!!deleteGarmentTypeTarget}
        onOpenChange={(open) => !open && setDeleteGarmentTypeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteGarmentTypeTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the subcategory. If any vendor has already priced or is using it, this
              will be blocked instead — you&apos;ll see an error explaining why.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteGarmentTypeTarget) return
                deleteGarmentType.mutate(deleteGarmentTypeTarget.id)
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
