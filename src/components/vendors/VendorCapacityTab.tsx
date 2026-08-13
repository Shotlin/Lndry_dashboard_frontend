"use client"

import { useState } from "react"
import { Loader2, AlertCircle, Plus, Pencil, Trash2, Zap } from "lucide-react"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import {
  useVendorCapacity,
  useReviewCapacityRequest,
  useSetDailyCapacity,
  useCreatePickupSlot,
  useUpdatePickupSlot,
  useDeletePickupSlot,
} from "@/hooks/useVendorCapacity"
import { adminCreatePickupSlot } from "@/services/vendors.service"
import type { VendorCapacity } from "@/services/vendors.service"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

type SlotRow = NonNullable<VendorCapacity["weekly_availability"]>[number]

export function VendorCapacityTab({ vendorId }: { vendorId: string }) {
  const queryClient = useQueryClient()
  const { data: capacity, isLoading, isError } = useVendorCapacity(vendorId)
  const reviewRequest = useReviewCapacityRequest(vendorId)
  const setCapacity = useSetDailyCapacity(vendorId)
  const createSlot = useCreatePickupSlot(vendorId)
  const updateSlot = useUpdatePickupSlot(vendorId)
  const deleteSlot = useDeletePickupSlot(vendorId)

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [adminNote, setAdminNote] = useState("")
  const [capacityInput, setCapacityInput] = useState("")
  const [slotDialogOpen, setSlotDialogOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<SlotRow | null>(null)
  const [slotForm, setSlotForm] = useState({ day_of_week: "1", start: "09:00", end: "18:00", max_orders: "10" })
  const [deleteTarget, setDeleteTarget] = useState<SlotRow | null>(null)

  // Bulk "every N hours" slot generation — manually adding one slot at a
  // time via the dialog above is impractical when a vendor wants e.g. six
  // 2-hour slots covering a full day across several days of the week.
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [bulkForm, setBulkForm] = useState({
    days: [1] as number[],
    start: "08:00",
    end: "20:00",
    interval_hours: "2",
    max_orders: "5",
  })
  const [isBulkGenerating, setIsBulkGenerating] = useState(false)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading capacity…
        </CardContent>
      </Card>
    )
  }

  if (isError || !capacity) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-semibold">Couldn't load capacity</p>
        </CardContent>
      </Card>
    )
  }

  // Not yet promoted from an application — there's no live daily_limit/slots
  // yet, only whatever the vendor asked for during onboarding.
  if (capacity.stage === "application") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-semibold">Not approved yet</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Requested capacity: {capacity.requested_daily_capacity ?? "N/A"} orders/day. Slot capacity is only tracked once this application is approved.
          </p>
        </CardContent>
      </Card>
    )
  }

  const pendingRequest = capacity.requests?.find((r) => r.status === "PENDING")

  function handleApprove() {
    if (!pendingRequest) return
    reviewRequest.mutate({ requestId: pendingRequest.id, status: "APPROVED" })
  }

  function confirmReject() {
    if (!pendingRequest) return
    reviewRequest.mutate(
      { requestId: pendingRequest.id, status: "REJECTED", adminNote: adminNote.trim() || undefined },
      { onSuccess: () => setRejectDialogOpen(false) }
    )
  }

  function submitCapacity() {
    const parsed = parseInt(capacityInput, 10)
    if (Number.isNaN(parsed) || parsed <= 0) return
    setCapacity.mutate(parsed, { onSuccess: () => setCapacityInput("") })
  }

  function openAddSlot() {
    setEditingSlot(null)
    setSlotForm({ day_of_week: "1", start: "09:00", end: "18:00", max_orders: "10" })
    setSlotDialogOpen(true)
  }

  function openEditSlot(slot: SlotRow) {
    setEditingSlot(slot)
    setSlotForm({
      day_of_week: String(slot.day_of_week),
      start: slot.start_time.slice(0, 5),
      end: slot.end_time.slice(0, 5),
      max_orders: String(slot.max_orders),
    })
    setSlotDialogOpen(true)
  }

  function submitSlot() {
    if (slotForm.end <= slotForm.start) {
      toast.error("End time must be after start time")
      return
    }
    const maxOrders = parseInt(slotForm.max_orders, 10) || 1
    if (editingSlot) {
      updateSlot.mutate(
        { slotId: editingSlot.id, payload: { start: slotForm.start, end: slotForm.end, max_orders: maxOrders } },
        { onSuccess: () => setSlotDialogOpen(false) }
      )
    } else {
      createSlot.mutate(
        { day_of_week: Number(slotForm.day_of_week), start: slotForm.start, end: slotForm.end, max_orders: maxOrders },
        { onSuccess: () => setSlotDialogOpen(false) }
      )
    }
  }

  function openBulkGenerate() {
    setBulkForm({ days: [1], start: "08:00", end: "20:00", interval_hours: "2", max_orders: "5" })
    setBulkDialogOpen(true)
  }

  function toggleBulkDay(day: number, checked: boolean) {
    setBulkForm((f) => ({
      ...f,
      days: checked ? [...f.days, day].sort() : f.days.filter((d) => d !== day),
    }))
  }

  // Steps [start, end) in `interval_hours` increments for every checked
  // day, e.g. 08:00 to 20:00 every 2 hours -> six slots per day.
  function computeBulkRanges(): { start: string; end: string }[] {
    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number)
      return h * 60 + m
    }
    const pad = (n: number) => String(n).padStart(2, "0")
    const fromMinutes = (mins: number) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`

    const startMin = toMinutes(bulkForm.start)
    const endMin = toMinutes(bulkForm.end)
    const stepMin = (parseFloat(bulkForm.interval_hours) || 0) * 60
    if (!(stepMin > 0) || endMin <= startMin) return []

    const ranges: { start: string; end: string }[] = []
    for (let cursor = startMin; cursor + stepMin <= endMin; cursor += stepMin) {
      ranges.push({ start: fromMinutes(cursor), end: fromMinutes(cursor + stepMin) })
    }
    return ranges
  }

  async function submitBulkGenerate() {
    const ranges = computeBulkRanges()
    const maxOrders = parseInt(bulkForm.max_orders, 10) || 1
    if (ranges.length === 0 || bulkForm.days.length === 0) return

    setIsBulkGenerating(true)
    let created = 0
    let failed = 0
    for (const day of bulkForm.days) {
      for (const range of ranges) {
        try {
          await adminCreatePickupSlot(vendorId, { day_of_week: day, start: range.start, end: range.end, max_orders: maxOrders })
          created += 1
        } catch {
          // Most likely a duplicate (vendor_id, day_of_week, start_time, end_time)
          // — skip and keep going rather than aborting the whole batch.
          failed += 1
        }
      }
    }
    setIsBulkGenerating(false)
    setBulkDialogOpen(false)
    if (created > 0) {
      queryClient.invalidateQueries({ queryKey: ["vendor-capacity", vendorId] })
      toast.success(`${created} slot${created === 1 ? "" : "s"} created${failed > 0 ? `, ${failed} skipped (already existed)` : ""}`)
    } else {
      toast.error("No slots were created — they may already exist")
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Daily capacity</CardTitle>
          <CardDescription>Maximum orders this vendor accepts per day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-4">
            <p className="text-3xl font-bold text-foreground">
              {capacity.daily_limit ?? "—"} <span className="text-sm font-normal text-muted-foreground">orders/day</span>
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                placeholder="New value"
                value={capacityInput}
                onChange={(e) => setCapacityInput(e.target.value)}
                className="h-9 w-28"
              />
              <Button
                size="sm"
                onClick={submitCapacity}
                disabled={setCapacity.isPending || !capacityInput}
              >
                {setCapacity.isPending ? "Saving…" : "Set"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {pendingRequest && (
        <Card className="border-warning/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending capacity request</CardTitle>
                <CardDescription>Submitted {new Date(pendingRequest.created_at).toLocaleString()}</CardDescription>
              </div>
              <Badge className="bg-warning-bg text-warning border-0">PENDING</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Current: <span className="font-semibold text-foreground">{pendingRequest.current_daily_limit_snapshot ?? capacity.daily_limit ?? "N/A"}</span></span>
              <span className="text-muted-foreground">→</span>
              <span className="text-muted-foreground">Requested: <span className="font-bold text-foreground">{pendingRequest.requested_daily_limit} orders/day</span></span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleApprove}
                disabled={reviewRequest.isPending}
                className="bg-success hover:bg-success/90 text-white font-semibold rounded-full h-9 px-5 text-sm"
              >
                {reviewRequest.isPending ? "Approving…" : "Approve"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setRejectDialogOpen(true)}
                disabled={reviewRequest.isPending}
                className="font-semibold rounded-full h-9 px-5 text-sm"
              >
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly pickup/delivery slots</CardTitle>
              <CardDescription>Per-slot order limits</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={openBulkGenerate} size="sm" variant="outline" className="gap-1.5">
                <Zap className="h-4 w-4" /> Generate slots
              </Button>
              <Button onClick={openAddSlot} size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Add slot
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!capacity.weekly_availability || capacity.weekly_availability.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No slots configured yet.</p>
          ) : (
            <div className="space-y-2">
              {capacity.weekly_availability.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 text-sm">
                  <span className="font-medium">{DAY_LABELS[slot.day_of_week]} · {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">Max {slot.max_orders} orders</span>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={slot.is_active}
                        onCheckedChange={(checked) => updateSlot.mutate({ slotId: slot.id, payload: { is_active: checked } })}
                      />
                      <Badge className={slot.is_active ? "bg-success-bg text-success border-0" : "bg-muted text-muted-foreground border-0"}>
                        {slot.is_active ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => openEditSlot(slot)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-danger hover:text-danger" onClick={() => setDeleteTarget(slot)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {capacity.exceptions && capacity.exceptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Date exceptions</CardTitle>
            <CardDescription>One-off overrides for specific dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {capacity.exceptions.map((exception) => (
              <div key={exception.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 text-sm">
                <span className="font-medium">{exception.date}</span>
                <span className="text-muted-foreground">{exception.type}{exception.limit_count != null ? ` · limit ${exception.limit_count}` : ""}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {capacity.requests && capacity.requests.filter((r) => r.status !== "PENDING").length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Request history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {capacity.requests
              .filter((r) => r.status !== "PENDING")
              .map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 text-sm">
                  <span>{r.requested_daily_limit} orders/day</span>
                  <div className="flex items-center gap-2">
                    {r.admin_note && <span className="text-xs text-muted-foreground">{r.admin_note}</span>}
                    <Badge className={r.status === "APPROVED" ? "bg-success-bg text-success border-0" : "bg-danger-bg text-danger border-0"}>
                      {r.status}
                    </Badge>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Add/edit slot */}
      <Dialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSlot ? "Edit slot" : "Add slot"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {!editingSlot && (
              <div className="space-y-1">
                <Label>Day</Label>
                <Select value={slotForm.day_of_week} onValueChange={(v) => setSlotForm((f) => ({ ...f, day_of_week: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAY_LABELS.map((label, idx) => (
                      <SelectItem key={idx} value={String(idx)}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Start time</Label>
                <Input type="time" value={slotForm.start} onChange={(e) => setSlotForm((f) => ({ ...f, start: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>End time</Label>
                <Input type="time" value={slotForm.end} onChange={(e) => setSlotForm((f) => ({ ...f, end: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Max orders</Label>
              <Input type="number" min={1} value={slotForm.max_orders} onChange={(e) => setSlotForm((f) => ({ ...f, max_orders: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlotDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitSlot} disabled={createSlot.isPending || updateSlot.isPending}>
              {createSlot.isPending || updateSlot.isPending ? "Saving…" : editingSlot ? "Save changes" : "Add slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk generate slots */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate slots</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Days</Label>
              <div className="flex flex-wrap gap-3">
                {DAY_LABELS.map((label, idx) => (
                  <label key={idx} className="flex items-center gap-1.5 text-sm">
                    <Checkbox
                      checked={bulkForm.days.includes(idx)}
                      onCheckedChange={(checked) => toggleBulkDay(idx, checked === true)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>From</Label>
                <Input type="time" value={bulkForm.start} onChange={(e) => setBulkForm((f) => ({ ...f, start: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>To</Label>
                <Input type="time" value={bulkForm.end} onChange={(e) => setBulkForm((f) => ({ ...f, end: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Every (hours)</Label>
                <Input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={bulkForm.interval_hours}
                  onChange={(e) => setBulkForm((f) => ({ ...f, interval_hours: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Max orders / slot</Label>
                <Input
                  type="number"
                  min={1}
                  value={bulkForm.max_orders}
                  onChange={(e) => setBulkForm((f) => ({ ...f, max_orders: e.target.value }))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {computeBulkRanges().length > 0
                ? `Creates ${computeBulkRanges().length} slot(s) per day × ${bulkForm.days.length} day(s) = ${computeBulkRanges().length * bulkForm.days.length} slot(s) total. Existing (day, start, end) combinations are skipped.`
                : "Set a valid time range and interval to preview how many slots will be created."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={submitBulkGenerate}
              disabled={isBulkGenerating || bulkForm.days.length === 0 || computeBulkRanges().length === 0}
            >
              {isBulkGenerating ? "Generating…" : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete slot confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this slot?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && `${DAY_LABELS[deleteTarget.day_of_week]} · ${deleteTarget.start_time.slice(0, 5)}–${deleteTarget.end_time.slice(0, 5)} will no longer accept pickups.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger hover:bg-danger/90"
              onClick={() => {
                if (deleteTarget) deleteSlot.mutate(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this capacity request?</AlertDialogTitle>
            <AlertDialogDescription>
              The vendor keeps their current capacity of {capacity.daily_limit ?? "N/A"} orders/day.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5 py-2">
            <label className="text-xs font-semibold text-muted-foreground">Note (optional)</label>
            <Textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Let the vendor know why, if helpful."
              className="min-h-[80px] text-sm"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reviewRequest.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              disabled={reviewRequest.isPending}
              className="bg-danger hover:bg-danger/90"
            >
              {reviewRequest.isPending ? "Rejecting…" : "Yes, reject request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
