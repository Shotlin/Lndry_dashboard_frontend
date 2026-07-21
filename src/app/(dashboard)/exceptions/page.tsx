"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useOrders } from "@/hooks/useOrders"
import { formatRelativeTime } from "@/lib/utils"

interface ExceptionOrder {
  id: string
  order_number: string
  status: string
  customer_name?: string
  shop_name?: string
  created_at: string
  exceptionType: "PAYMENT" | "VENDOR"
  priority: "P1" | "P2"
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "P1") return <span className="inline-flex px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#B91C1C] text-[10px] font-bold">{priority}</span>
  return <span className="inline-flex px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold">{priority}</span>
}

export default function ExceptionsPage() {
  const router = useRouter()
  const { data: paymentData, isLoading: pLoading, isError: pError, refetch: refetchPayment } = useOrders({ status: "PAYMENT_FAILED", limit: 50 })
  const { data: waitingData, isLoading: wLoading, isError: wError, refetch: refetchWaiting } = useOrders({ status: "WAITING_VENDOR_CONFIRMATION", limit: 50 })

  const isLoading = pLoading || wLoading
  const isError = pError || wError

  const allExceptions = useMemo<ExceptionOrder[]>(() => {
    const payment = (paymentData?.orders ?? []).map((o: any) => ({
      ...o,
      exceptionType: "PAYMENT" as const,
      priority: "P1" as const,
    }))
    const waiting = (waitingData?.orders ?? []).map((o: any) => ({
      ...o,
      exceptionType: "VENDOR" as const,
      priority: "P2" as const,
    }))
    return [...payment, ...waiting].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [paymentData, waitingData])

  const handleRefresh = () => {
    refetchPayment()
    refetchWaiting()
  }

  // Top priority cards (up to 3)
  const priorityCards = allExceptions.slice(0, 3).map((exc) => ({
    title: exc.exceptionType === "PAYMENT" ? "Payment reconciliation pending" : "Vendor response timeout risk",
    badge: exc.exceptionType === "PAYMENT" ? "Payment" : "Status",
    badgeColor: exc.exceptionType === "PAYMENT" ? "bg-[#FEF3C7] text-[#B45309]" : "bg-[#EEF2FF] text-[#6366F1]",
    desc: exc.exceptionType === "PAYMENT"
      ? `#${exc.order_number} · payment unresolved`
      : `#${exc.order_number} · waiting for vendor acceptance`,
    orderId: exc.id,
    actionLabel: exc.exceptionType === "PAYMENT" ? "Check payment events" : "Open order audit",
    filled: exc.priority === "P1",
  }))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#080f14]">Exception queue</h1>
          <p className="text-[12px] text-[#7e8998] mt-0.5">Override actions require a reason and security audit entry</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex px-3 py-1.5 rounded-full text-[12px] font-bold ${
            allExceptions.length > 0 ? "bg-[#FEF2F2] text-[#B91C1C]" : "bg-[#ECFDF5] text-[#047857]"
          }`}>
            {isLoading ? "..." : `${allExceptions.length} open`}
          </span>
          <Button
            variant="outline"
            className="border-[#6366F1] text-[#6366F1] hover:bg-[#EEF2FF] font-bold rounded-full h-10 px-5 text-[13px]"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh queue
          </Button>
        </div>
      </div>

      {/* Priority exception cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="lndry-card flex flex-col justify-between min-h-[160px]">
              <div>
                <Skeleton className="h-5 w-16 rounded-full mb-3" />
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-9 w-full rounded-full mt-4" />
            </div>
          ))}
        </div>
      ) : allExceptions.length === 0 ? (
        <div className="lndry-card flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#ECFDF5] flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-[#047857]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="text-[15px] font-bold text-[#080f14]">All clear — no exceptions in queue</h3>
          <p className="text-[12px] text-[#7e8998] mt-1">All orders are processing normally</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {priorityCards.map((exc, i) => (
            <div key={i} className="lndry-card flex flex-col justify-between min-h-[160px]">
              <div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${exc.badgeColor}`}>{exc.badge}</span>
                <h3 className="text-[15px] font-bold text-[#080f14] mt-2">{exc.title}</h3>
                <p className="text-[12px] text-[#7e8998] mt-1.5 leading-relaxed">{exc.desc}</p>
              </div>
              <Button
                className={exc.filled
                  ? "bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold rounded-full h-9 text-[12px] mt-4 shadow-[0_4px_14px_rgba(6,182,212,0.25)]"
                  : "border-[#6366F1] text-[#6366F1] hover:bg-[#EEF2FF] font-bold rounded-full h-9 text-[12px] mt-4"
                }
                variant={exc.filled ? "default" : "outline"}
                onClick={() => router.push(`/orders/${exc.orderId}`)}
              >
                {exc.actionLabel}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="lndry-card flex flex-col items-center justify-center py-12 text-center">
          <p className="text-[14px] text-[#B91C1C] font-semibold mb-3">Failed to load exceptions</p>
          <Button onClick={handleRefresh} variant="outline" className="rounded-full text-[13px] font-bold">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
          </Button>
        </div>
      )}

      {/* All open exceptions table */}
      {!isError && allExceptions.length > 0 && (
        <div className="lndry-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-[#080f14]">All open exceptions</h2>
            <span className="inline-flex px-2.5 py-1 rounded-full border border-[#B91C1C]/30 text-[#B91C1C] text-[10px] font-bold">Reason required</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e8e8ef]">
                  <th className="lndry-th">Priority</th>
                  <th className="lndry-th">Order</th>
                  <th className="lndry-th">Exception</th>
                  <th className="lndry-th">Customer</th>
                  <th className="lndry-th">Age</th>
                  <th className="lndry-th">Next safe action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f4f8]">
                {allExceptions.map((e) => (
                  <tr key={e.id} className="hover:bg-[#fafafd] transition-colors cursor-pointer" onClick={() => router.push(`/orders/${e.id}`)}>
                    <td className="py-4 px-2"><PriorityBadge priority={e.priority} /></td>
                    <td className="py-4 px-2">
                      <Link href={`/orders/${e.id}`} className="font-bold text-[#080f14] hover:text-[#6366F1]" onClick={(ev) => ev.stopPropagation()}>
                        #{e.order_number}
                      </Link>
                    </td>
                    <td className="py-4 px-2 text-[#334155]">
                      {e.exceptionType === "PAYMENT" ? "Payment reconciliation" : "Vendor response pending"}
                    </td>
                    <td className="py-4 px-2 text-[#334155]">{e.customer_name || "—"}</td>
                    <td className="py-4 px-2 text-[#7e8998]">{formatRelativeTime(e.created_at)}</td>
                    <td className="py-4 px-2">
                      <Link href={`/orders/${e.id}`} className="text-[#6366F1] font-semibold hover:text-[#4F46E5]" onClick={(ev) => ev.stopPropagation()}>
                        {e.exceptionType === "PAYMENT" ? "Review payment" : "Contact vendor"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
