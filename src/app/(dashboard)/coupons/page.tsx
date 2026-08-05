"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react"
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
import { useCustomerSegments } from "@/hooks/useCustomerSegments"
import { useDebounce } from "@/hooks/useDebounce"
import {
  createCoupon,
  deleteCoupon,
  getCoupons,
  getCouponTargetUsers,
  updateCoupon,
} from "@/services/coupons.service"
import { getCustomers } from "@/services/customers.service"
import type { Coupon, CouponTargetType, DiscountType, UpdateCouponPayload } from "@/types"

const TARGET_TYPE_LABELS: Record<CouponTargetType, string> = {
  ALL: "All users",
  SEGMENT: "A customer segment",
  INDIVIDUAL: "Specific customers",
  FIRST_TIME: "First-time users only",
}

type TargetCustomer = { id: string; name: string | null; phone: string | null }

/** Search + multi-select picker for "Specific customers" targeting. */
function CustomerTargetPicker({
  selected,
  onChange,
}: {
  selected: TargetCustomer[]
  onChange: (next: TargetCustomer[]) => void
}) {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)

  const { data, isFetching } = useQuery({
    queryKey: ["coupon-target-customer-search", debouncedSearch],
    queryFn: () => getCustomers({ search: debouncedSearch, limit: 10 }),
    enabled: debouncedSearch.length >= 2,
  })

  const selectedIds = new Set(selected.map((c) => c.id))
  const results = (data?.customers ?? []).filter((c) => !selectedIds.has(c.id))

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers by name or phone..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {debouncedSearch.length >= 2 && (
        <div className="rounded-md border bg-card max-h-40 overflow-y-auto">
          {isFetching ? (
            <div className="p-2.5 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching...
            </div>
          ) : results.length === 0 ? (
            <p className="p-2.5 text-sm text-muted-foreground">No matching customers</p>
          ) : (
            results.map((c) => (
              <button
                type="button"
                key={c.id}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center justify-between"
                onClick={() => {
                  onChange([...selected, { id: c.id, name: c.name, phone: c.phone }])
                  setSearch("")
                }}
              >
                <span>{c.name ?? "Unnamed"}</span>
                <span className="text-xs text-muted-foreground">{c.phone}</span>
              </button>
            ))
          )}
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((c) => (
            <Badge key={c.id} variant="secondary" className="gap-1 pr-1">
              {c.name ?? c.phone}
              <button
                type="button"
                onClick={() => onChange(selected.filter((s) => s.id !== c.id))}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

type CouponForm = {
  code: string
  description: string
  discountType: DiscountType
  discountValue: string
  minOrderAmount: string
  maxDiscount: string
  usageLimit: string
  perUserLimit: string
  validFrom: string
  validUntil: string
  isActive: boolean
  targetType: CouponTargetType
  targetSegmentId: string | undefined
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

function createInitialForm(coupon?: Coupon | null): CouponForm {
  return {
    code: coupon?.code ?? "",
    description: coupon?.description ?? "",
    discountType: coupon?.discountType ?? "PERCENTAGE",
    discountValue: coupon?.discountValue != null ? String(coupon.discountValue) : "",
    minOrderAmount: coupon?.minOrderAmount != null ? String(coupon.minOrderAmount) : "",
    maxDiscount: coupon?.maxDiscount != null ? String(coupon.maxDiscount) : "",
    usageLimit: coupon?.usageLimit != null ? String(coupon.usageLimit) : "",
    perUserLimit: coupon?.perUserLimit != null ? String(coupon.perUserLimit) : "1",
    validFrom: toDatetimeLocalValue(coupon?.validFrom),
    validUntil: toDatetimeLocalValue(coupon?.validUntil),
    isActive: coupon?.isActive ?? true,
    targetType: coupon?.targetType ?? "ALL",
    targetSegmentId: coupon?.targetSegmentId ?? undefined,
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
  const [targetCustomers, setTargetCustomers] = useState<TargetCustomer[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const { data: segments } = useCustomerSegments()

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["coupons"] })

  const createMutation = useMutation({ mutationFn: createCoupon })
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCouponPayload }) =>
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
    setTargetCustomers([])
    setDialogOpen(true)
  }

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setForm(createInitialForm(coupon))
    setTargetCustomers([])
    if (coupon.targetType === "INDIVIDUAL") {
      getCouponTargetUsers(coupon.id)
        .then((users) => setTargetCustomers(users.map((u) => ({ id: u.id, name: u.name, phone: u.phone }))))
        .catch(() => {})
    }
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingCoupon(null)
    setForm(createInitialForm())
    setTargetCustomers([])
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
    const usageLimit = form.usageLimit.trim() === "" ? undefined : Number(form.usageLimit)
    const perUserLimit = form.perUserLimit.trim() === "" ? undefined : Number(form.perUserLimit)

    if (usageLimit !== undefined && (!Number.isInteger(usageLimit) || usageLimit < 1)) {
      toast.error("Total usage limit must be a whole number of at least 1")
      return
    }

    const validFrom = form.validFrom ? new Date(form.validFrom).toISOString() : undefined
    const validUntil = form.validUntil ? new Date(form.validUntil).toISOString() : undefined
    if (validFrom && validUntil && new Date(validFrom) > new Date(validUntil)) {
      toast.error("Valid From must be before Valid Until")
      return
    }

    if (form.targetType === "SEGMENT" && !form.targetSegmentId) {
      toast.error("Choose a customer segment for this coupon")
      return
    }
    if (form.targetType === "INDIVIDUAL" && targetCustomers.length === 0) {
      toast.error("Add at least one customer for this coupon")
      return
    }

    const targetSegmentId = form.targetType === "SEGMENT" ? form.targetSegmentId : undefined
    const targetUserIds = form.targetType === "INDIVIDUAL" ? targetCustomers.map((c) => c.id) : undefined

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
            usageLimit,
            perUserLimit,
            validFrom,
            validUntil,
            isActive: form.isActive,
            targetType: form.targetType,
            targetSegmentId,
            targetUserIds,
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
          usageLimit,
          perUserLimit,
          validFrom,
          validUntil,
          targetType: form.targetType,
          targetSegmentId,
          targetUserIds,
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
              <TableHead>Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[180px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 8 }).map((__, cell) => (
                    <TableCell key={cell}>
                      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
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
                  <TableCell className="text-muted-foreground text-sm">
                    {TARGET_TYPE_LABELS[coupon.targetType ?? "ALL"]}
                  </TableCell>
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
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="coupon-usage-limit">Total Usage Limit</Label>
                <Input
                  id="coupon-usage-limit"
                  type="number"
                  min={1}
                  value={form.usageLimit}
                  onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                  placeholder="Unlimited if empty"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-valid-from">Valid From</Label>
                <Input
                  id="coupon-valid-from"
                  type="datetime-local"
                  value={form.validFrom}
                  onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-valid-until">Valid Until</Label>
                <Input
                  id="coupon-valid-until"
                  type="datetime-local"
                  value={form.validUntil}
                  onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5 rounded-lg border p-3">
              <Label>Who can use this coupon?</Label>
              <Select
                value={form.targetType}
                onValueChange={(v) => {
                  const targetType = v as CouponTargetType
                  setForm((f) => ({ ...f, targetType, targetSegmentId: undefined }))
                  setTargetCustomers([])
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TARGET_TYPE_LABELS) as CouponTargetType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {TARGET_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {form.targetType === "SEGMENT" && (
                <div className="pt-2">
                  <Select
                    value={form.targetSegmentId ?? ""}
                    onValueChange={(v) => setForm((f) => ({ ...f, targetSegmentId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a segment..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(segments ?? []).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.member_count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {segments?.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      No segments yet — create one under Customer Segments first.
                    </p>
                  )}
                </div>
              )}

              {form.targetType === "INDIVIDUAL" && (
                <div className="pt-2">
                  <CustomerTargetPicker selected={targetCustomers} onChange={setTargetCustomers} />
                </div>
              )}

              {form.targetType === "FIRST_TIME" && (
                <p className="text-xs text-muted-foreground pt-1">
                  Only customers placing their first order can redeem this coupon.
                </p>
              )}
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
