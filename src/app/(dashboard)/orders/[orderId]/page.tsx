"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useOrderDetail } from "@/hooks/useOrders"
import { formatINR, formatDateTime, formatRelativeTime } from "@/lib/utils"

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

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>()
  const orderId = params?.orderId ?? null
  const { data: order, isLoading, isError, refetch } = useOrderDetail(orderId)

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/orders" className="text-[13px] text-[#6366F1] hover:text-[#4F46E5] font-medium">&larr; Orders</Link>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#080f14] mt-2">Order #{order.order_number}</h1>
          <p className="text-[13px] text-[#7e8998] mt-0.5">{order.customer_name || "Guest"} · {shopName}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Order and payment */}
        <div className="space-y-4">
          <div className="lndry-card">
            <h2 className="text-[15px] font-bold text-[#080f14] mb-4">Order and payment</h2>
            <div className="space-y-3 text-[13px]">
              {(order.items ?? []).map((item, i) => (
                <div key={item.id ?? i} className="flex justify-between">
                  <span className="text-[#7e8998]">{item.quantity} × {item.name}</span>
                  <span className="text-[#080f14] font-medium">{formatINR(item.total)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-[#f0f0f5]">
                <span className="text-[#7e8998]">Total amount</span>
                <span className="text-[#080f14] font-bold">{formatINR(order.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7e8998]">Payment</span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    order.payment_status === "PAID"
                      ? "bg-[#ECFDF5] text-[#047857]"
                      : "bg-[#FEF3C7] text-[#B45309]"
                  }`}
                >
                  {order.payment_method} · {order.payment_status === "PAID" ? "Paid" : "Unpaid"}
                </span>
              </div>
              {order.scheduled_slot_label && (
                <div className="flex justify-between">
                  <span className="text-[#7e8998]">Pickup slot</span>
                  <span className="text-[#080f14] font-medium">{order.scheduled_slot_label}</span>
                </div>
              )}
            </div>
          </div>

          <div className="lndry-card">
            <h2 className="text-[15px] font-bold text-[#080f14] mb-4">Assignments and OTP audit</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#fafafd] border border-[#f0f0f5]">
                <div>
                  <div className="text-[12px] text-[#7e8998]">Pickup</div>
                  <div className="text-[13px] font-bold text-[#080f14] mt-0.5">{shopName}</div>
                </div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    pickupOtpVerified ? "bg-[#ECFDF5] text-[#047857]" : "bg-[#FEF3C7] text-[#B45309]"
                  }`}
                >
                  {pickupOtpVerified ? "OTP verified" : "Pending"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#fafafd] border border-[#f0f0f5]">
                <div>
                  <div className="text-[12px] text-[#7e8998]">Delivery</div>
                  <div className="text-[13px] font-bold text-[#080f14] mt-0.5">{order.rider_name || "Not assigned"}</div>
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

        {/* Right: Timeline */}
        <div className="lndry-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-bold text-[#080f14]">Order timeline</h2>
          </div>
          <div className="relative pl-6 space-y-0">
            {(order.timeline ?? []).length === 0 ? (
              <p className="text-[13px] text-[#7e8998]">No status changes recorded yet.</p>
            ) : (
              (order.timeline ?? []).map((item, i, arr) => (
                <div key={item.id ?? i} className="relative pb-6 last:pb-0">
                  {i < arr.length - 1 && (
                    <div className="absolute left-[-14px] top-[10px] bottom-[-6px] w-[2px] bg-[#e8e8ef]" />
                  )}
                  <div
                    className="absolute left-[-18px] top-[6px] w-[10px] h-[10px] rounded-full border-2"
                    style={{
                      borderColor: timelineDotColor(item.to_status),
                      backgroundColor: `${timelineDotColor(item.to_status)}20`,
                    }}
                  />
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[13px] font-bold text-[#080f14]">{item.to_status.replaceAll("_", " ")}</div>
                      <div className="text-[12px] text-[#7e8998] mt-0.5">
                        {item.note || "—"}{item.changed_by_name ? ` · ${item.changed_by_name}` : ""}
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
    </div>
  )
}
