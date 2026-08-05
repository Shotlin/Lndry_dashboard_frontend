"use client"

import { Suspense, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, Gift, Search, Send } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useIncompleteOrders,
  useIncompleteOrdersSummary,
  useSendRecoveryReminder,
  useIssueRecoveryCoupon,
} from "@/hooks/useOrderRecovery"
import { getIncompleteOrderDetail } from "@/services/order-recovery.service"
import { useDebounce } from "@/hooks/useDebounce"
import { formatDateTime } from "@/lib/utils"
import type { IncompleteOrder } from "@/types/order-recovery.types"

function formatPaise(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
}

/** "12m left" / "Expired" countdown against the payment's 15-min window */
function PaymentCountdown({ order }: { order: IncompleteOrder }) {
  if (!order.paymentExpiresAt) {
    return <span className="text-xs text-muted-foreground">No payment attempt</span>
  }
  const msLeft = new Date(order.paymentExpiresAt).getTime() - Date.now()
  if (msLeft <= 0) {
    return <Badge variant="outline" className="text-destructive border-destructive/40">Expired</Badge>
  }
  const minsLeft = Math.ceil(msLeft / 60000)
  return <Badge variant="secondary">{minsLeft}m left</Badge>
}

function IncompleteOrdersContent() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [notifyTarget, setNotifyTarget] = useState<IncompleteOrder | null>(null)
  const [couponTarget, setCouponTarget] = useState<IncompleteOrder | null>(null)

  const { data: summary } = useIncompleteOrdersSummary()
  const { data, isLoading } = useIncompleteOrders({ search: debouncedSearch || undefined, limit: 20 })
  const orders = data?.orders ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incomplete Orders"
        subtitle="Checkouts that started but never completed payment — nudge customers back with a reminder or a coupon."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Incomplete right now</p>
          <p className="text-2xl font-semibold">{summary?.incompleteCount ?? "—"}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Value at risk</p>
          <p className="text-2xl font-semibold">
            {summary ? formatPaise(summary.incompleteValuePaise) : "—"}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Recovered today</p>
          <p className="text-2xl font-semibold">{summary?.recoveredToday ?? "—"}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by customer name or phone..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="hidden md:table-cell">Reminders</TableHead>
              <TableHead className="hidden md:table-cell">Started</TableHead>
              <TableHead className="w-[180px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    icon={<AlertTriangle className="h-6 w-6 text-muted-foreground" />}
                    title="No incomplete checkouts"
                    description="Every recent checkout attempt either completed or hasn't started yet."
                  />
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <p className="font-medium">{order.userName ?? "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{order.userPhone}</p>
                  </TableCell>
                  <TableCell className="text-sm">{order.vendorName ?? "—"}</TableCell>
                  <TableCell className="font-medium">{formatPaise(order.payableAmountPaise)}</TableCell>
                  <TableCell>
                    <PaymentCountdown order={order} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {order.reminderCount > 0 ? `${order.reminderCount} sent` : "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setNotifyTarget(order)}>
                        <Send className="h-3.5 w-3.5 mr-1.5" /> Notify
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setCouponTarget(order)}>
                        <Gift className="h-3.5 w-3.5 mr-1.5" /> Coupon
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <NotifyDialog order={notifyTarget} onClose={() => setNotifyTarget(null)} />
      <IssueCouponDialog order={couponTarget} onClose={() => setCouponTarget(null)} />
    </div>
  )
}

function NotifyDialog({ order, onClose }: { order: IncompleteOrder | null; onClose: () => void }) {
  const [title, setTitle] = useState("Still need your laundry picked up?")
  const [body, setBody] = useState("Complete your payment to lock in your pickup slot before it's gone.")
  const mutation = useSendRecoveryReminder(order?.id ?? "")

  const handleSend = () => {
    if (!title.trim() || !body.trim()) return
    mutation.mutate({ title: title.trim(), body: body.trim() }, { onSuccess: onClose })
  }

  return (
    <Dialog open={!!order} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send reminder to {order?.userName ?? "customer"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="notify-title">Title</Label>
            <Input id="notify-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notify-body">Message</Label>
            <Textarea id="notify-body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} maxLength={300} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={mutation.isPending}>
            {mutation.isPending ? "Sending..." : "Send Reminder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function IssueCouponDialog({ order, onClose }: { order: IncompleteOrder | null; onClose: () => void }) {
  const [mode, setMode] = useState<"NEW" | "EXISTING">("NEW")
  const [couponId, setCouponId] = useState("")
  const [code, setCode] = useState("")
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE")
  const [discountValue, setDiscountValue] = useState("10")
  const mutation = useIssueRecoveryCoupon(order?.id ?? "")

  const { data: detail } = useQuery({
    queryKey: ["incomplete-orders", order?.id, "detail-for-coupon"],
    queryFn: () => getIncompleteOrderDetail(order!.id),
    enabled: !!order,
  })

  const handleIssue = () => {
    if (mode === "EXISTING") {
      if (!couponId.trim()) return
      mutation.mutate({ couponId: couponId.trim() }, { onSuccess: onClose })
      return
    }
    const value = Number(discountValue)
    if (!code.trim() || !Number.isFinite(value) || value <= 0) return
    mutation.mutate(
      { code: code.trim().toUpperCase(), discountType, discountValue: value },
      { onSuccess: onClose }
    )
  }

  return (
    <Dialog open={!!order} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Issue coupon to {order?.userName ?? "customer"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={mode} onValueChange={(v) => setMode(v as "NEW" | "EXISTING")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NEW">Create a new coupon</SelectItem>
              <SelectItem value="EXISTING">Use an existing coupon (by ID)</SelectItem>
            </SelectContent>
          </Select>

          {mode === "NEW" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="coupon-code">Coupon Code</Label>
                <Input
                  id="coupon-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. COMEBACK20"
                  className="font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Discount Type</Label>
                  <Select value={discountType} onValueChange={(v) => setDiscountType(v as "PERCENTAGE" | "FLAT")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FLAT">Flat amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="coupon-value">
                    {discountType === "PERCENTAGE" ? "Percent Off (%)" : "Amount Off (₹)"}
                  </Label>
                  <Input
                    id="coupon-value"
                    type="number"
                    min={0}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Created just for this customer (Target Audience is forced to &quot;Specific customers&quot;).
              </p>
            </>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="coupon-id">Coupon ID</Label>
              <Input id="coupon-id" value={couponId} onChange={(e) => setCouponId(e.target.value)} placeholder="Paste the coupon's ID" />
              <p className="text-xs text-muted-foreground">
                Adds this customer to that coupon&apos;s target list without disturbing anyone else already on it.
              </p>
            </div>
          )}

          {detail && detail.couponsIssued.length > 0 && (
            <div className="rounded-md border p-2.5 text-xs text-muted-foreground">
              Already issued {detail.couponsIssued.length} coupon{detail.couponsIssued.length === 1 ? "" : "s"} to this customer for this checkout.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleIssue} disabled={mutation.isPending}>
            {mutation.isPending ? "Issuing..." : "Issue Coupon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function IncompleteOrdersPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="table" />}>
      <IncompleteOrdersContent />
    </Suspense>
  )
}
