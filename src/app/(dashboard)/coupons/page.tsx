"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { EmptyState } from "@/components/shared/EmptyState"
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
  createCoupon,
  deleteCoupon,
  getCoupons,
  updateCoupon,
} from "@/services/coupons.service"
import type { Coupon, DiscountType } from "@/types"

type CouponForm = {
  code: string
  description: string
  discountType: DiscountType
  discountValue: string
  minOrderAmount: string
  maxDiscount: string
  perUserLimit: string
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

function createInitialForm(coupon?: Coupon | null): CouponForm {
  return {
    code: coupon?.code ?? "",
    description: coupon?.description ?? "",
    discountType: coupon?.discountType ?? "PERCENTAGE",
    discountValue: coupon?.discountValue != null ? String(coupon.discountValue) : "",
    minOrderAmount: coupon?.minOrderAmount != null ? String(coupon.minOrderAmount) : "",
    maxDiscount: coupon?.maxDiscount != null ? String(coupon.maxDiscount) : "",
    perUserLimit: coupon?.perUserLimit != null ? String(coupon.perUserLimit) : "1",
    isActive: coupon?.isActive ?? true,
  }
}

function formatDiscount(coupon: Coupon) {
  return coupon.discountType === "PERCENTAGE"
    ? `${coupon.discountValue}% off`
    : `₹${coupon.discountValue} off`
}

export default function CouponsPage() {
  const queryClient = useQueryClient()
  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: getCoupons,
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)
  const [form, setForm] = useState<CouponForm>(createInitialForm())
  const [isSaving, setIsSaving] = useState(false)

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["coupons"] })

  const createMutation = useMutation({ mutationFn: createCoupon })
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CouponForm> }) =>
      updateCoupon(id, payload),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      toast.success("Coupon deleted")
      setDeleteTarget(null)
      refresh()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
      setDeleteTarget(null)
    },
  })

  const openCreateDialog = () => {
    setEditingCoupon(null)
    setForm(createInitialForm())
    setDialogOpen(true)
  }

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setForm(createInitialForm(coupon))
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingCoupon(null)
    setForm(createInitialForm())
  }

  const handleSubmit = async () => {
    const code = form.code.trim().toUpperCase()
    const discountValue = Number(form.discountValue)
    if (!code) {
      toast.error("Coupon code is required")
      return
    }
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      toast.error("Discount value must be a positive number")
      return
    }
    if (form.discountType === "PERCENTAGE" && discountValue > 100) {
      toast.error("Percentage discount can't exceed 100")
      return
    }

    const minOrderAmount = form.minOrderAmount.trim() === "" ? undefined : Number(form.minOrderAmount)
    const maxDiscount = form.maxDiscount.trim() === "" ? undefined : Number(form.maxDiscount)
    const perUserLimit = form.perUserLimit.trim() === "" ? undefined : Number(form.perUserLimit)

    setIsSaving(true)
    try {
      if (editingCoupon) {
        await updateMutation.mutateAsync({
          id: editingCoupon.id,
          payload: {
            code,
            description: form.description.trim() || undefined,
            discountType: form.discountType,
            discountValue,
            minOrderAmount,
            maxDiscount,
            perUserLimit,
            isActive: form.isActive,
          },
        })
        toast.success("Coupon updated")
      } else {
        await createMutation.mutateAsync({
          code,
          description: form.description.trim() || undefined,
          discountType: form.discountType,
          discountValue,
          minOrderAmount,
          maxDiscount,
          perUserLimit,
        })
        toast.success("Coupon created")
      }
      refresh()
      closeDialog()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons"
        subtitle="Platform-wide discount codes customers can apply at checkout — flat amount or percentage off."
      >
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Coupon
        </Button>
      </PageHeader>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Min Order</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[180px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 7 }).map((__, cell) => (
                    <TableCell key={cell}>
                      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    title="No coupons yet"
                    description="Create your first discount code — flat amount or percentage off."
                  />
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {coupon.description || "—"}
                  </TableCell>
                  <TableCell>{formatDiscount(coupon)}</TableCell>
                  <TableCell>₹{coupon.minOrderAmount}</TableCell>
                  <TableCell>{coupon.usedCount}</TableCell>
                  <TableCell>
                    <Badge variant={coupon.isActive ? "default" : "secondary"}>
                      {coupon.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(coupon)}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeleteTarget(coupon)}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Edit Coupon" : "Add Coupon"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="coupon-code">Coupon Code</Label>
              <Input
                id="coupon-code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. LNDRY20"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-description">Description</Label>
              <Input
                id="coupon-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Shown to customers, e.g. 20% off your first pickup"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(v) => setForm((f) => ({ ...f, discountType: v as DiscountType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FLAT">Flat amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-value">
                  {form.discountType === "PERCENTAGE" ? "Percent Off (%)" : "Amount Off (₹)"}
                </Label>
                <Input
                  id="coupon-value"
                  type="number"
                  min={0}
                  max={form.discountType === "PERCENTAGE" ? 100 : undefined}
                  value={form.discountValue}
                  onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                  placeholder={form.discountType === "PERCENTAGE" ? "e.g. 20" : "e.g. 50"}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-min-order">Min Order (₹)</Label>
                <Input
                  id="coupon-min-order"
                  type="number"
                  min={0}
                  value={form.minOrderAmount}
                  onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
                  placeholder="0"
                />
              </div>
              {form.discountType === "PERCENTAGE" && (
                <div className="space-y-2">
                  <Label htmlFor="coupon-max-discount">Max Discount (₹)</Label>
                  <Input
                    id="coupon-max-discount"
                    type="number"
                    min={0}
                    value={form.maxDiscount}
                    onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                    placeholder="Optional cap"
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-per-user-limit">Uses Per Customer</Label>
              <Input
                id="coupon-per-user-limit"
                type="number"
                min={1}
                value={form.perUserLimit}
                onChange={(e) => setForm((f) => ({ ...f, perUserLimit: e.target.value }))}
              />
            </div>
            {editingCoupon && (
              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">
                    Customers can only apply active coupons.
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
              {editingCoupon ? "Save Changes" : "Create Coupon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.code}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the coupon. Customers will no longer be able to apply this code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return
                deleteMutation.mutate(deleteTarget.id)
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
