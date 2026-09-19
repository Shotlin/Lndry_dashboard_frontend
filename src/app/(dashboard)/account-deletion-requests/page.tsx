"use client"

import { Suspense, useState } from "react"
import { AlertTriangle, Check, Search, UserX, X } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useAccountDeletionRequests,
  useApproveAccountDeletion,
  useRejectAccountDeletion,
} from "@/hooks/useAccountDeletion"
import { useDebounce } from "@/hooks/useDebounce"
import { usePermissions } from "@/hooks/usePermissions"
import { formatDate, formatDateTime, formatINR } from "@/lib/utils"
import type { AccountDeletionRequest, AccountDeletionStatus } from "@/types"

const STATUS_VARIANT: Record<AccountDeletionStatus, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "outline",
  COMPLETED: "destructive",
}

const STATUS_LABEL: Record<AccountDeletionStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved · in grace period",
  REJECTED: "Rejected",
  COMPLETED: "Deleted",
}

const FILTERS: Array<{ value: AccountDeletionStatus | undefined; label: string }> = [
  { value: undefined, label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "COMPLETED", label: "Deleted" },
]

function daysUntil(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}

type Decision = { kind: "approve" | "reject"; request: AccountDeletionRequest }

function DecisionDialog({
  decision,
  onClose,
}: {
  decision: Decision | null
  onClose: () => void
}) {
  const [note, setNote] = useState("")
  const approve = useApproveAccountDeletion()
  const reject = useRejectAccountDeletion()
  const pending = approve.isPending || reject.isPending

  if (!decision) return null
  const { kind, request } = decision
  const isApprove = kind === "approve"
  const blocked = isApprove && request.activeOrderCount > 0

  const submit = () => {
    const mutation = isApprove ? approve : reject
    mutation.mutate(
      { id: request.id, note: note.trim() || undefined },
      {
        onSuccess: () => {
          setNote("")
          onClose()
        },
      }
    )
  }

  return (
    <Dialog open onOpenChange={(v) => !v && !pending && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isApprove ? "Approve account deletion?" : "Reject deletion request?"}</DialogTitle>
          <DialogDescription>
            {request.customerName || "Customer"} · {request.customerPhone || "—"}
          </DialogDescription>
        </DialogHeader>

        {isApprove ? (
          <div className="space-y-3 text-sm">
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>The account is deactivated <strong>now</strong> and the customer is signed out everywhere.</li>
              <li>
                After <strong>30 days</strong> their name, phone, email, photo, addresses and devices are permanently
                wiped. Order and payment records are kept, anonymized.
              </li>
              <li>This cannot be undone once approved.</li>
            </ul>
            {request.walletBalance > 0 && (
              <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  This customer still has <strong>{formatINR(request.walletBalance)}</strong> in their wallet. It will
                  be unreachable once the account is deleted.
                </span>
              </div>
            )}
            {blocked && (
              <div className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  {request.activeOrderCount} order(s) are still in progress. Approve after they finish, or reject this
                  request.
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            The customer&apos;s account stays active and nothing is deleted. The request is recorded as rejected.
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="decision-note">Note (optional)</Label>
          <Textarea
            id="decision-note"
            rows={3}
            maxLength={500}
            placeholder="Internal note recorded with this decision"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant={isApprove ? "destructive" : "default"}
            onClick={submit}
            disabled={pending || blocked}
          >
            {pending ? "Working..." : isApprove ? "Approve & start 30 days" : "Reject request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AccountDeletionContent() {
  const [status, setStatus] = useState<AccountDeletionStatus | undefined>(undefined)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [decision, setDecision] = useState<Decision | null>(null)
  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading } = useAccountDeletionRequests({
    status,
    search: debouncedSearch || undefined,
    page,
    limit: 20,
  })
  const { can } = usePermissions()
  const canDecide = can("customers.write")

  const requests = data?.requests ?? []
  const counts = data?.counts
  const totalPages = data?.pagination.totalPages ?? 1

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Deletion Requests"
        subtitle="Customers ask to delete their account from the app. Approving deactivates it immediately and permanently wipes personal data after 30 days."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = status === f.value
            const count = f.value ? counts?.[f.value] : undefined
            return (
              <Button
                key={f.label}
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => {
                  setStatus(f.value)
                  setPage(1)
                }}
              >
                {f.label}
                {count !== undefined && <span className="ml-1.5 opacity-70">{count}</span>}
              </Button>
            )
          })}
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or phone..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Account</TableHead>
              <TableHead className="hidden md:table-cell">Deletion / decision</TableHead>
              <TableHead className="w-44" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState
                    icon={<UserX className="h-6 w-6 text-muted-foreground" />}
                    title="No deletion requests"
                    description="Requests appear here when a customer taps Delete Account in the app"
                  />
                </TableCell>
              </TableRow>
            ) : (
              requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.customerName || "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.customerPhone || "—"}</div>
                    {r.reason && (
                      <div className="mt-1 max-w-[220px] truncate text-xs italic text-muted-foreground" title={r.reason}>
                        &ldquo;{r.reason}&rdquo;
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(r.requestedAt)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {r.status === "PENDING" || r.status === "APPROVED" ? (
                      <>
                        <div>Wallet: {formatINR(r.walletBalance)}</div>
                        <div className={r.activeOrderCount > 0 ? "text-destructive font-medium" : undefined}>
                          Active orders: {r.activeOrderCount}
                        </div>
                      </>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {r.status === "APPROVED" && r.scheduledDeletionAt && (
                      <div>
                        Deletes {formatDate(r.scheduledDeletionAt)}{" "}
                        <span className="font-medium">({daysUntil(r.scheduledDeletionAt)}d left)</span>
                      </div>
                    )}
                    {r.status === "COMPLETED" && r.completedAt && <div>Wiped {formatDate(r.completedAt)}</div>}
                    {r.reviewedAt && (
                      <div>
                        {r.status === "REJECTED" ? "Rejected" : "Approved"} {formatDate(r.reviewedAt)}
                        {r.reviewedByName ? ` by ${r.reviewedByName}` : ""}
                      </div>
                    )}
                    {r.reviewNote && <div className="max-w-[220px] truncate" title={r.reviewNote}>Note: {r.reviewNote}</div>}
                    {!r.reviewedAt && r.status === "PENDING" && "Awaiting review"}
                  </TableCell>
                  <TableCell>
                    {canDecide && r.status === "PENDING" && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setDecision({ kind: "reject", request: r })}>
                          <X className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                        <Button size="sm" onClick={() => setDecision({ kind: "approve", request: r })}>
                          <Check className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3 text-sm">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <DecisionDialog key={decision?.request.id ?? "none"} decision={decision} onClose={() => setDecision(null)} />
    </div>
  )
}

export default function AccountDeletionRequestsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="table" />}>
      <AccountDeletionContent />
    </Suspense>
  )
}
