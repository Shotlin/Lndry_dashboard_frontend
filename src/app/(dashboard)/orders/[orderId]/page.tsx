"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { RefreshCw, Printer, User, MapPin, Store, Bike, Receipt, Undo2, Package, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useOrderDetail, useRefundOrderPayment } from "@/hooks/useOrders"
import { formatDateTime, formatRelativeTime } from "@/lib/utils"
import type { OrderPaymentEntry } from "@/types"

function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase() || ""
  if (s === "PROCESSING")
    return <span className="inline-flex px-3 py-1.5 rounded-full bg-[#ECFDF5] text-[#047857] text-[11px] font-bold">Processing</span>
  if (s === "WAITING_VENDOR_CONFIRMATION" || s === "PENDING")
    return <span className="inline-flex px-3 py-1.5 rounded-full bg-[#FEF3C7] text-[#B45309] text-[11px] font-bold">Waiting vendor</span>
  if (s === "VENDOR_ACCEPTED" || s === "PICKUP_SCHEDULED")
    return <span className="inline-flex px-3 py-1.5 rounded-full bg-[#EEF2FF] text-[#6366F1] text-[11px] font-bold">{s === "VENDOR_ACCEPTED" ? "Vendor accepted" : "Pickup scheduled"}</span>
  if (s === "OUT_FOR_DELIVERY" || s === "SHIPPED")
    return <span className="inline-flex px-3 py-1.5 rounded-full bg-[#ECFDF5] text-[#047857] text-[11px] font-bold border border-[#047857]/20">Out for delivery</span>
  if (s === "DELIVERED")
    return <span className="inline-flex px-3 py-1.5 rounded-full bg-[#ECFDF5] text-[#047857] text-[11px] font-bold">Delivered</span>
  if (s === "CANCELLED" || s === "PAYMENT_FAILED" || s === "REJECTED" || s.includes("REJECTED") || s.includes("CANCELLED"))
    return <span className="inline-flex px-3 py-1.5 rounded-full bg-[#FEF2F2] text-[#B91C1C] text-[11px] font-bold">{s === "PAYMENT_FAILED" ? "Payment failed" : "Cancelled"}</span>
  return <span className="inline-flex px-3 py-1.5 rounded-full bg-[#F1F1F5] text-[#64748B] text-[11px] font-bold">{status}</span>
}

function timelineDotColor(toStatus: string) {
  const s = toStatus?.toUpperCase() || ""
  if (s.includes("REJECTED") || s.includes("CANCELLED") || s === "PAYMENT_FAILED") return "#B91C1C"
  if (s === "DELIVERED" || s === "VENDOR_ACCEPTED" || s === "PICKUP_OTP_VERIFIED" || s === "DELIVERY_OTP_VERIFIED") return "#047857"
  return "#6366F1"
}

const rupees = (n: number | string | null | undefined) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const PAYMENT_STATE: Record<string, { label: string; cls: string }> = {
  UNPAID: { label: "Unpaid", cls: "bg-[#FEF3C7] text-[#B45309]" },
  PARTIALLY_PAID: { label: "Partly paid", cls: "bg-[#FEF3C7] text-[#B45309]" },
  PAID: { label: "Paid in full", cls: "bg-[#ECFDF5] text-[#047857]" },
  PARTIALLY_REFUNDED: { label: "Partly refunded", cls: "bg-[#EEF2FF] text-[#4F46E5]" },
  REFUNDED: { label: "Refunded", cls: "bg-[#F1F1F5] text-[#64748B]" },
}

const PURPOSE_LABEL: Record<string, string> = { ADVANCE: "Advance", BALANCE: "Balance", FULL: "Full payment" }

function PaymentStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: "bg-[#ECFDF5] text-[#047857]",
    PENDING: "bg-[#FEF3C7] text-[#B45309]",
    FAILED: "bg-[#FEF2F2] text-[#B91C1C]",
    REFUNDED: "bg-[#F1F1F5] text-[#64748B]",
  }
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${map[status] ?? map.PENDING}`}>{status}</span>
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" | "muted" }) {
  const color = tone === "good" ? "text-[#047857]" : tone === "warn" ? "text-[#B45309]" : "text-[#080f14]"
  return (
    <div className="lndry-card !p-4">
      <div className="text-[12px] text-[#7e8998]">{label}</div>
      <div className={`text-[22px] font-bold mt-1 ${color}`}>{value}</div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-4 text-[13px]">
      <span className="text-[#7e8998]">{label}</span>
      <span className={`text-right ${bold ? "font-bold text-[#080f14]" : "text-[#080f14] font-medium"}`}>{value}</span>
    </div>
  )
}

function RefundDialog({
  orderId,
  payment,
  onClose,
}: {
  orderId: string
  payment: OrderPaymentEntry
  onClose: () => void
}) {
  const refund = useRefundOrderPayment(orderId)
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const max = payment.refundable_amount
  const value = amount === "" ? max : Number(amount)
  const invalid = !(value > 0) || value > max
  const viaWallet = payment.method === "LNDRY_WALLET" || !payment.razorpay_payment_id
  return (
    <Dialog open onOpenChange={(o) => !o && !refund.isPending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refund {PURPOSE_LABEL[payment.purpose] ?? "payment"}</DialogTitle>
          <DialogDescription>
            {viaWallet
              ? "This payment was made from the LNDRY wallet, so the money goes back to the customer's wallet."
              : "The refund is sent to Razorpay now and returns to the customer's original payment method, usually in 5–7 working days."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex justify-between text-[13px]">
            <span className="text-[#7e8998]">Paid</span>
            <span className="font-semibold">{rupees(payment.amount)}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-[#7e8998]">Can still refund</span>
            <span className="font-semibold">{rupees(max)}</span>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="refund-amount">Refund amount (₹)</Label>
            <Input
              id="refund-amount"
              type="number"
              min={0.01}
              max={max}
              step="0.01"
              value={amount}
              placeholder={max.toFixed(2)}
              onChange={(e) => setAmount(e.target.value)}
            />
            {amount !== "" && value > max && (
              <p className="text-[12px] text-[#B91C1C]">More than the {rupees(max)} that can be refunded.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="refund-reason">Reason</Label>
            <Input
              id="refund-reason"
              value={reason}
              maxLength={500}
              placeholder="e.g. Order cancelled by vendor"
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={refund.isPending}>
            Cancel
          </Button>
          <Button
            disabled={invalid || refund.isPending}
            onClick={() =>
              refund.mutate(
                { paymentId: payment.id, amount: amount === "" ? undefined : Number(amount), reason: reason.trim() || undefined },
                { onSuccess: onClose }
              )
            }
          >
            {refund.isPending ? "Refunding…" : `Refund ${rupees(value || 0)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function addressText(a: Record<string, unknown> | null | undefined) {
  if (!a) return "—"
  const parts = ["label", "line1", "line2", "address_line", "address_line1", "address_line2", "landmark", "city", "state", "pincode"]
    .map((k) => a[k])
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
  return parts.length ? parts.join(", ") : "—"
}

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>()
  const orderId = params?.orderId ?? null
  const { data: order, isLoading, isError, refetch } = useOrderDetail(orderId)
  const [refundTarget, setRefundTarget] = useState<OrderPaymentEntry | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="lndry-card flex flex-col items-center justify-center py-16 text-center">
        <p className="text-[14px] text-[#B91C1C] font-semibold mb-3">Failed to load order</p>
        <Button onClick={() => refetch()} variant="outline" className="rounded-full text-[13px] font-bold">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
        </Button>
      </div>
    )
  }

  const shopName = order.shop_name || order.shop?.name || "—"
  const pickupOtpVerified = order.timeline?.some((t) => t.to_status === "PICKUP_OTP_VERIFIED")
  const fin = order.financials
  const payments = order.payments ?? []
  const state = fin ? PAYMENT_STATE[fin.payment_state] : null
  const itemsTotal = (order.items ?? []).reduce((s, i) => s + Number(i.total || 0), 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/orders" className="text-[13px] text-[#6366F1] hover:text-[#4F46E5] font-medium">
            &larr; Orders
          </Link>
          <h1 className="text-[28px] font-bold tracking-tight text-[#080f14] mt-2">Order #{order.order_number}</h1>
          <p className="text-[13px] text-[#7e8998] mt-0.5">
            Placed {formatDateTime(order.created_at)} · {formatRelativeTime(order.created_at)}
            {order.booking_type === "ASSISTED" ? " · Assisted booking" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {state && <span className={`inline-flex px-3 py-1.5 rounded-full text-[11px] font-bold ${state.cls}`}>{state.label}</span>}
          <StatusBadge status={order.status} />
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
          </Button>
        </div>
      </div>

      {fin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label={fin.is_estimate ? "Order value (estimate)" : "Order value"} value={rupees(fin.total)} />
          <Stat label="Paid so far" value={rupees(fin.net_paid)} tone={fin.net_paid > 0 ? "good" : "muted"} />
          <Stat label="Balance to collect" value={rupees(fin.balance_due)} tone={fin.balance_due > 0 ? "warn" : "good"} />
          <Stat label="Refunded" value={rupees(fin.refunded)} tone="muted" />
        </div>
      )}
      {fin?.is_estimate && (
        <p className="text-[12px] text-[#B45309] bg-[#FEF3C7] rounded-xl px-4 py-2.5">
          This is an assisted booking: the final price is confirmed by the vendor after inspecting the garments. The balance will change once it is confirmed.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="lndry-card">
            <h2 className="text-[15px] font-bold text-[#080f14] mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-[#6366F1]" /> Items ordered
            </h2>
            {(order.items ?? []).length === 0 ? (
              <p className="text-[13px] text-[#7e8998]">
                No items yet.{order.booking_type === "ASSISTED" ? " The vendor adds the garments and services after inspection." : ""}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-[#7e8998] border-b border-[#f0f0f5]">
                      <th className="py-2 font-semibold">Item</th>
                      <th className="py-2 font-semibold text-right">Qty</th>
                      <th className="py-2 font-semibold text-right">Rate</th>
                      <th className="py-2 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items ?? []).map((item, i) => (
                      <tr key={item.id ?? i} className="border-b border-[#f7f7fa] last:border-0">
                        <td className="py-2.5 font-medium text-[#080f14]">{item.name}</td>
                        <td className="py-2.5 text-right">
                          {item.quantity}
                          {item.unit ? ` ${item.unit}` : ""}
                          {item.confirmed_quantity != null &&
                            item.estimated_quantity != null &&
                            item.confirmed_quantity !== item.estimated_quantity && (
                              <div className="text-[11px] text-[#7e8998]">est. {item.estimated_quantity}</div>
                            )}
                        </td>
                        <td className="py-2.5 text-right text-[#7e8998]">{rupees(item.price)}</td>
                        <td className="py-2.5 text-right font-semibold">{rupees(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {fin && (
              <div className="mt-4 pt-4 border-t border-[#f0f0f5] space-y-2">
                <Row label="Items" value={rupees(itemsTotal || fin.breakdown.subtotal)} />
                {fin.breakdown.discount > 0 && <Row label="Discount" value={`− ${rupees(fin.breakdown.discount)}`} />}
                {fin.breakdown.delivery_fee > 0 && <Row label="Delivery fee" value={rupees(fin.breakdown.delivery_fee)} />}
                {fin.breakdown.platform_fee > 0 && <Row label="Platform fee" value={rupees(fin.breakdown.platform_fee)} />}
                {fin.breakdown.handling_fee > 0 && <Row label="Handling fee" value={rupees(fin.breakdown.handling_fee)} />}
                {fin.breakdown.late_night_fee > 0 && <Row label="Late-night fee" value={rupees(fin.breakdown.late_night_fee)} />}
                {fin.breakdown.tax > 0 && <Row label="Tax" value={rupees(fin.breakdown.tax)} />}
                {fin.breakdown.tip > 0 && <Row label="Tip" value={rupees(fin.breakdown.tip)} />}
                <Row label="Order total" value={rupees(fin.total)} bold />
              </div>
            )}
          </div>

          <div className="lndry-card">
            <h2 className="text-[15px] font-bold text-[#080f14] mb-4 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[#6366F1]" /> Payments &amp; refunds
            </h2>
            {payments.length === 0 ? (
              <p className="text-[13px] text-[#7e8998]">No payment has been started for this order.</p>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div key={p.id} className="rounded-xl border border-[#f0f0f5] bg-[#fafafd] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-bold text-[#080f14]">{PURPOSE_LABEL[p.purpose] ?? p.purpose}</span>
                          <PaymentStatusPill status={p.status} />
                        </div>
                        <div className="text-[12px] text-[#7e8998] mt-1">
                          {p.method === "LNDRY_WALLET" ? "LNDRY wallet" : p.method ? p.method.toUpperCase() : "Method not chosen"}
                          {" · "}
                          {p.paid_at ? `Paid ${formatDateTime(p.paid_at)}` : `Started ${formatDateTime(p.created_at)}`}
                        </div>
                        {p.razorpay_payment_id && (
                          <div className="text-[11px] text-[#7e8998] mt-1 font-mono break-all">Razorpay: {p.razorpay_payment_id}</div>
                        )}
                        {p.failure_reason && <div className="text-[12px] text-[#B91C1C] mt-1">{p.failure_reason}</div>}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[16px] font-bold text-[#080f14]">{rupees(p.amount)}</div>
                        {p.refunded_amount > 0 && <div className="text-[12px] text-[#4F46E5]">Refunded {rupees(p.refunded_amount)}</div>}
                        {p.refundable_amount > 0 && (
                          <Button size="sm" variant="outline" className="mt-2 rounded-full h-8 text-[12px]" onClick={() => setRefundTarget(p)}>
                            <Undo2 className="h-3.5 w-3.5 mr-1" /> Refund
                          </Button>
                        )}
                      </div>
                    </div>
                    {p.refunds.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#ececf3] space-y-1">
                        {p.refunds.map((r) => (
                          <div key={r.id} className="flex justify-between text-[12px] text-[#7e8998]">
                            <span>
                              {formatDateTime(r.at)} · {r.destination === "WALLET" ? "to wallet" : "to original payment"}
                              {r.reason ? ` · ${r.reason}` : ""}
                            </span>
                            <span className="font-semibold text-[#4F46E5]">− {rupees(r.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lndry-card">
            <h2 className="text-[15px] font-bold text-[#080f14] mb-5">Order timeline</h2>
            <div className="relative pl-6 space-y-0">
              {(order.timeline ?? []).length === 0 ? (
                <p className="text-[13px] text-[#7e8998]">No status changes recorded yet.</p>
              ) : (
                (order.timeline ?? []).map((item, i, arr) => (
                  <div key={item.id ?? i} className="relative pb-6 last:pb-0">
                    {i < arr.length - 1 && <div className="absolute left-[-14px] top-[10px] bottom-[-6px] w-[2px] bg-[#e8e8ef]" />}
                    <div
                      className="absolute left-[-18px] top-[6px] w-[10px] h-[10px] rounded-full border-2"
                      style={{ borderColor: timelineDotColor(item.to_status), backgroundColor: `${timelineDotColor(item.to_status)}20` }}
                    />
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[13px] font-bold text-[#080f14]">{item.to_status.replaceAll("_", " ")}</div>
                        <div className="text-[12px] text-[#7e8998] mt-0.5">
                          {item.note || "—"}
                          {item.changed_by_name ? ` · ${item.changed_by_name}` : ""}
                        </div>
                      </div>
                      <span className="text-[11px] text-[#7e8998] font-medium shrink-0 ml-4" title={formatDateTime(item.changed_at)}>
                        {formatRelativeTime(item.changed_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="lndry-card">
            <h2 className="text-[15px] font-bold text-[#080f14] mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-[#6366F1]" /> Customer
            </h2>
            <div className="text-[14px] font-bold text-[#080f14]">{order.customer_name || "Guest"}</div>
            {order.customer_phone && (
              <div className="text-[13px] text-[#7e8998] mt-1 flex items-center gap-1.5">
                <Phone className="h-3 w-3" />
                {order.customer_phone}
              </div>
            )}
            {order.customer_email && (
              <div className="text-[13px] text-[#7e8998] mt-1 flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                {order.customer_email}
              </div>
            )}
          </div>

          <div className="lndry-card">
            <h2 className="text-[15px] font-bold text-[#080f14] mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#6366F1]" /> Pickup &amp; delivery
            </h2>
            <div className="space-y-2.5">
              <Row label="Address" value={<span className="max-w-[200px] inline-block">{addressText(order.delivery_address as unknown as Record<string, unknown>)}</span>} />
              {order.scheduled_slot_label && <Row label="Pickup slot" value={order.scheduled_slot_label} />}
              {order.pickup_date && <Row label="Pickup date" value={String(order.pickup_date).slice(0, 10)} />}
              {order.vendor_delivery_slot_label && <Row label="Delivery slot" value={order.vendor_delivery_slot_label} />}
              {order.delivery_notes && <Row label="Notes" value={order.delivery_notes} />}
              {(order.estimated_weight || order.actual_weight) && (
                <Row label="Weight" value={`${order.actual_weight ?? "—"} kg actual · ${order.estimated_weight ?? "—"} kg est.`} />
              )}
            </div>
          </div>

          <div className="lndry-card">
            <h2 className="text-[15px] font-bold text-[#080f14] mb-3 flex items-center gap-2">
              <Store className="h-4 w-4 text-[#6366F1]" /> Vendor
            </h2>
            <div className="text-[14px] font-bold text-[#080f14]">{shopName}</div>
            <div className="flex items-center justify-between mt-3 p-3 rounded-xl bg-[#fafafd] border border-[#f0f0f5]">
              <span className="text-[12px] text-[#7e8998]">Pickup OTP</span>
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  pickupOtpVerified ? "bg-[#ECFDF5] text-[#047857]" : "bg-[#FEF3C7] text-[#B45309]"
                }`}
              >
                {pickupOtpVerified ? "Verified" : "Pending"}
              </span>
            </div>
          </div>

          <div className="lndry-card">
            <h2 className="text-[15px] font-bold text-[#080f14] mb-3 flex items-center gap-2">
              <Bike className="h-4 w-4 text-[#6366F1]" /> Delivery
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] font-bold text-[#080f14]">{order.rider_name || "Not assigned"}</div>
                {order.rider_phone && <div className="text-[12px] text-[#7e8998] mt-0.5">{order.rider_phone}</div>}
              </div>
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  order.delivery ? "bg-[#ECFDF5] text-[#047857]" : "bg-[#FEF3C7] text-[#B45309]"
                }`}
              >
                {order.delivery ? order.delivery.status : "Pending"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {refundTarget && <RefundDialog orderId={order.id} payment={refundTarget} onClose={() => setRefundTarget(null)} />}
    </div>
  )
}
