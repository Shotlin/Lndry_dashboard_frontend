"use client"

import { useState } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
import { useVendorCapacity, useReviewCapacityRequest } from "@/hooks/useVendorCapacity"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function VendorCapacityTab({ vendorId }: { vendorId: string }) {
  const { data: capacity, isLoading, isError } = useVendorCapacity(vendorId)
  const reviewRequest = useReviewCapacityRequest(vendorId)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [adminNote, setAdminNote] = useState("")

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Daily capacity</CardTitle>
          <CardDescription>Maximum orders this vendor accepts per day</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-foreground">
            {capacity.daily_limit ?? "—"} <span className="text-sm font-normal text-muted-foreground">orders/day</span>
          </p>
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
          <CardTitle>Weekly pickup/delivery slots</CardTitle>
          <CardDescription>Per-slot order limits set by the vendor</CardDescription>
        </CardHeader>
        <CardContent>
          {!capacity.weekly_availability || capacity.weekly_availability.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No slots configured yet.</p>
          ) : (
            <div className="space-y-2">
              {capacity.weekly_availability.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 text-sm">
                  <span className="font-medium">{DAY_LABELS[slot.day_of_week]} · {slot.start_time}–{slot.end_time}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Max {slot.max_orders} orders</span>
                    <Badge className={slot.is_active ? "bg-success-bg text-success border-0" : "bg-muted text-muted-foreground border-0"}>
                      {slot.is_active ? "ACTIVE" : "INACTIVE"}
                    </Badge>
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
