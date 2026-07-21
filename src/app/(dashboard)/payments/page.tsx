"use client"

import { useState } from "react"
import { Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { usePayments, useIssueRefund } from "@/hooks/usePayments"
import { useDebounce } from "@/hooks/useDebounce"
import { formatINR } from "@/lib/utils"
import type { PaymentRecord } from "@/services/payments-admin.service"

function StatusBadge({ status }: { status: PaymentRecord["status"] }) {
  if (status === "PAID") return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857] text-[10px] font-bold">{status}</span>
  if (status === "PENDING") return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold">{status}</span>
  if (status === "FAILED") return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FEF2F2] text-[#B91C1C] text-[10px] font-bold">{status}</span>
  return <span className="inline-flex px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#6366F1] text-[10px] font-bold border border-[#6366F1]/10">{status}</span>
}

export default function PaymentsPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [refundTarget, setRefundTarget] = useState<PaymentRecord | null>(null)
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, isError } = usePayments({
    search: debouncedSearch || undefined,
    page,
    limit: 20,
  })
  const issueRefund = useIssueRefund()

  const payments = data?.payments ?? []
  const pagination = data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 }

  const confirmRefund = () => {
    if (!refundTarget) return
    issueRefund.mutate(
      { paymentId: refundTarget.id },
      { onSettled: () => setRefundTarget(null) }
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#080f14]">Payment operations</h1>
          <p className="text-[13px] text-[#7e8998] mt-0.5">Track payment states, Razorpay references, and trigger refunds</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <Input
            placeholder="Search customer, order, gateway ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10 h-11 rounded-full bg-white border-[#e8e8ef] text-[13px] shadow-sm"
          />
        </div>
      </div>

      <div className="lndry-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#e8e8ef]">
                <th className="lndry-th">Gateway reference</th>
                <th className="lndry-th">Order</th>
                <th className="lndry-th">Customer</th>
                <th className="lndry-th">Amount</th>
                <th className="lndry-th">Status</th>
                <th className="lndry-th">Method</th>
                <th className="lndry-th">Date</th>
                <th className="lndry-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f4f8]">
              {isLoading && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#7e8998]">
                    <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                    Loading payments…
                  </td>
                </tr>
              )}
              {isError && !isLoading && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#B91C1C]">
                    Failed to load payments.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && payments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#7e8998]">
                    No payments found.
                  </td>
                </tr>
              )}
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-[#fafafd] transition-colors">
                  <td className="py-4 px-2 font-bold text-[#080f14] font-mono text-[12px]">
                    {p.razorpay_payment_id || p.razorpay_order_id || "—"}
                  </td>
                  <td className="py-4 px-2 text-[#334155] font-mono text-[12px]">{p.order_number || "—"}</td>
                  <td className="py-4 px-2 text-[#334155] font-semibold">{p.customer_name || "—"}</td>
                  <td className="py-4 px-2 text-[#080f14] font-bold">{formatINR(Number(p.amount))}</td>
                  <td className="py-4 px-2"><StatusBadge status={p.status} /></td>
                  <td className="py-4 px-2 text-[#334155] text-[12px]">{p.method || "—"}</td>
                  <td className="py-4 px-2 text-[#7e8998] text-[12px]">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-2 text-right">
                    {p.status === "PAID" ? (
                      <Button
                        variant="outline"
                        disabled={issueRefund.isPending}
                        onClick={() => setRefundTarget(p)}
                        className="border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2] font-bold rounded-full h-8 px-4 text-[12px] transition-colors"
                      >
                        Issue refund
                      </Button>
                    ) : (
                      <span className="text-[12px] text-[#7e8998]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-2 py-4">
            <span className="text-[12px] text-[#7e8998]">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} payments
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!refundTarget} onOpenChange={(open) => !open && setRefundTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Issue refund?</AlertDialogTitle>
            <AlertDialogDescription>
              This will refund {refundTarget ? formatINR(Number(refundTarget.amount)) : ""} to{" "}
              {refundTarget?.customer_name || "the customer"} via Razorpay and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmRefund}
            >
              Issue refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
