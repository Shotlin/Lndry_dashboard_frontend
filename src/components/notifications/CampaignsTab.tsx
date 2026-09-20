"use client"

import { useState } from "react"
import { CalendarClock, Eye, FileEdit, Loader2, RefreshCw, Trash2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { formatDateTime } from "@/lib/utils"
import {
  useCampaign, useCampaigns, useCancelCampaign, useDeleteCampaign,
} from "@/hooks/useNotifications"
import { audienceLabel } from "./AudiencePicker"
import { linkLabel } from "./deep-links"
import type { CampaignStatus, DeepLink, NotificationCampaign } from "@/types/notification.types"

const STATUS_STYLE: Record<CampaignStatus, string> = {
  DRAFT: "bg-[#F1F5F9] text-[#475569]",
  QUEUED: "bg-[#EEF2FF] text-[#4338CA]",
  SCHEDULED: "bg-[#EFF6FF] text-[#1D4ED8]",
  SENDING: "bg-[#FFFBEB] text-[#B45309]",
  SENT: "bg-[#ECFDF5] text-[#047857]",
  FAILED: "bg-[#FEF2F2] text-[#B91C1C]",
  CANCELLED: "bg-[#F1F1F5] text-[#64748B]",
}
const STATUS_LABEL: Record<CampaignStatus, string> = {
  DRAFT: "Draft", QUEUED: "Queued", SCHEDULED: "Scheduled", SENDING: "Sending", SENT: "Sent", FAILED: "Failed", CANCELLED: "Cancelled",
}
const FILTERS: (CampaignStatus | "ALL")[] = ["ALL", "DRAFT", "SCHEDULED", "SENDING", "SENT", "FAILED", "CANCELLED"]
const PAGE_SIZE = 15

function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[status]}`}>
      {status === "SENDING" && <Loader2 className="h-3 w-3 animate-spin" />}
      {STATUS_LABEL[status]}
    </span>
  )
}

function linkOf(c: NotificationCampaign): DeepLink | null {
  return c.deep_link_type ? { type: c.deep_link_type, params: c.deep_link_params ?? {} } : null
}

/** Sent / scheduled / created time, whichever describes the row best. */
function whenOf(c: NotificationCampaign): { label: string; value: string } {
  if (c.status === "SCHEDULED" && c.scheduled_at) return { label: "Scheduled for", value: c.scheduled_at }
  if (c.sent_at) return { label: "Sent", value: c.sent_at }
  if (c.scheduled_at) return { label: "Scheduled for", value: c.scheduled_at }
  return { label: "Created", value: c.created_at }
}

interface Props {
  onEditDraft: (c: NotificationCampaign) => void
}

export function CampaignsTab({ onEditDraft }: Props) {
  const [status, setStatus] = useState<CampaignStatus | "ALL">("ALL")
  const [page, setPage] = useState(1)
  const [detailId, setDetailId] = useState<string | null>(null)
  const { data, isLoading, isError, refetch, isFetching } = useCampaigns(page, PAGE_SIZE, status === "ALL" ? undefined : status)
  const cancel = useCancelCampaign()
  const remove = useDeleteCampaign()

  const campaigns = data?.campaigns ?? []
  const total = data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v as CampaignStatus | "ALL"); setPage(1) }}>
          <SelectTrigger className="h-9 w-44 rounded-full text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FILTERS.map((f) => <SelectItem key={f} value={f}>{f === "ALL" ? "All statuses" : STATUS_LABEL[f]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="lndry-card !p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Notification</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Target</TableHead>
              <TableHead className="text-right">Sent</TableHead>
              <TableHead className="text-right">Failed</TableHead>
              <TableHead className="text-right">Opened</TableHead>
              <TableHead className="text-right">Open rate</TableHead>
              <TableHead className="w-[1%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={10}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              ))
            ) : isError ? (
              <TableRow><TableCell colSpan={10} className="py-10 text-center text-[13px] text-[#B91C1C]">Could not load campaigns. <button className="font-semibold underline" onClick={() => refetch()}>Retry</button></TableCell></TableRow>
            ) : campaigns.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="py-12 text-center text-[13px] text-[#7e8998]">{status === "ALL" ? "No notifications yet. Use Send now or Schedule to create the first one." : "No notifications with this status."}</TableCell></TableRow>
            ) : (
              campaigns.map((c) => {
                const w = whenOf(c)
                return (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => setDetailId(c.id)}>
                    <TableCell className="max-w-[260px]">
                      <p className="truncate text-[13px] font-semibold text-[#0f172a]">{c.title}</p>
                      <p className="truncate text-[11px] text-[#94a3b8]">Opens: {linkLabel(linkOf(c))}</p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[12px] text-[#475569]">{audienceLabel(c.audience)}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell className="whitespace-nowrap text-[12px] text-[#475569]"><span className="block text-[10px] uppercase text-[#94a3b8]">{w.label}</span>{formatDateTime(w.value)}</TableCell>
                    <TableCell className="text-right text-[13px] tabular-nums">{c.target_count.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-[13px] tabular-nums text-[#047857]">{c.sent_count.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-[13px] tabular-nums text-[#B91C1C]">{(c.failed_count ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-[13px] tabular-nums">{(c.opened_count ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-[13px] font-semibold tabular-nums">{c.status === "SENT" ? `${c.open_rate}%` : "—"}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="View details" onClick={() => setDetailId(c.id)}><Eye className="h-4 w-4" /></Button>
                        {c.status === "DRAFT" && <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit draft" onClick={() => onEditDraft(c)}><FileEdit className="h-4 w-4" /></Button>}
                        {c.status === "SCHEDULED" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#B45309]" title="Cancel scheduled send" disabled={cancel.isPending}
                            onClick={() => { if (window.confirm("Cancel this scheduled notification? Nothing will be sent.")) cancel.mutate(c.id) }}><XCircle className="h-4 w-4" /></Button>
                        )}
                        {(c.status === "DRAFT" || c.status === "CANCELLED") && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#B91C1C]" title="Delete" disabled={remove.isPending}
                            onClick={() => { if (window.confirm("Delete this notification?")) remove.mutate(c.id) }}><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-[12px] text-[#64748b]">
          <span>{total.toLocaleString()} notifications</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span>Page {page} of {pages}</span>
            <Button variant="outline" size="sm" className="rounded-full" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}

      <CampaignDetailSheet id={detailId} onClose={() => setDetailId(null)} />
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-[#e8e8ef] bg-[#fafafd] px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">{label}</p>
      <p className={`text-[20px] font-bold tabular-nums ${tone ?? "text-[#0f172a]"}`}>{value}</p>
    </div>
  )
}

function CampaignDetailSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: c, isLoading } = useCampaign(id)
  return (
    <Sheet open={!!id} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Notification details</SheetTitle>
          <SheetDescription>Delivery and open statistics from the real registered devices.</SheetDescription>
        </SheetHeader>
        {isLoading || !c ? (
          <div className="mt-6 space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-40 w-full" /></div>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="rounded-2xl border border-[#e8e8ef] bg-[#fafafd] p-3">
              <div className="mb-2 flex items-center justify-between"><StatusBadge status={c.status} /><span className="text-[11px] text-[#94a3b8]">{c.created_by_name ? `by ${c.created_by_name}` : ""}</span></div>
              <p className="text-[14px] font-bold text-[#0f172a]">{c.title}</p>
              <p className="mt-1 whitespace-pre-line text-[13px] text-[#475569]">{c.body}</p>
              {c.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image_url} alt="" className="mt-2 h-32 w-full rounded-lg object-cover" />
              )}
            </div>

            <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-[13px]">
              <dt className="text-[#94a3b8]">Audience</dt><dd className="font-semibold text-[#0f172a]">{audienceLabel(c.audience)}</dd>
              <dt className="text-[#94a3b8]">Opens</dt><dd className="font-semibold text-[#0f172a]">{linkLabel(linkOf(c))}</dd>
              <dt className="text-[#94a3b8]">Created</dt><dd>{formatDateTime(c.created_at)}</dd>
              {c.scheduled_at && <><dt className="text-[#94a3b8]">Scheduled</dt><dd className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-[#1D4ED8]" />{formatDateTime(c.scheduled_at)}</dd></>}
              {c.sent_at && <><dt className="text-[#94a3b8]">Sent</dt><dd>{formatDateTime(c.sent_at)}</dd></>}
              {c.expires_at && <><dt className="text-[#94a3b8]">Expires</dt><dd>{formatDateTime(c.expires_at)}</dd></>}
            </dl>

            <div className="grid grid-cols-3 gap-2.5">
              <Stat label="People" value={c.target_count.toLocaleString()} />
              <Stat label="Devices" value={(c.device_count ?? 0).toLocaleString()} />
              <Stat label="Sent" value={c.sent_count.toLocaleString()} tone="text-[#047857]" />
              <Stat label="Failed" value={(c.failed_count ?? 0).toLocaleString()} tone={(c.failed_count ?? 0) > 0 ? "text-[#B91C1C]" : undefined} />
              <Stat label="Opened" value={(c.opened_count ?? 0).toLocaleString()} />
              <Stat label="Open rate" value={c.status === "SENT" ? `${c.open_rate}%` : "—"} tone="text-[#6366F1]" />
            </div>

            {c.failure_summary?.reason && (
              <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[12px] text-[#B91C1C]">{c.failure_summary.reason}</div>
            )}

            {c.breakdown.length > 0 && (
              <div>
                <h4 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[#94a3b8]">By app</h4>
                <div className="overflow-hidden rounded-xl border border-[#e8e8ef]">
                  <Table>
                    <TableHeader><TableRow><TableHead>App</TableHead><TableHead>Result</TableHead><TableHead className="text-right">Devices</TableHead><TableHead className="text-right">Opened</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {c.breakdown.map((b, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-[13px]">{b.app_type === "partner" ? "Partner app" : "Customer app"}</TableCell>
                          <TableCell className="text-[13px]">{b.status === "SENT" ? "Sent" : b.status === "INVALID_TOKEN" ? "Invalid token" : "Failed"}</TableCell>
                          <TableCell className="text-right text-[13px] tabular-nums">{b.count}</TableCell>
                          <TableCell className="text-right text-[13px] tabular-nums">{b.opened}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {c.errors.length > 0 && (
              <div>
                <h4 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[#94a3b8]">Why some failed</h4>
                <ul className="space-y-1 text-[12px] text-[#475569]">
                  {c.errors.map((e, i) => <li key={i} className="flex justify-between"><span>{e.error_code ?? "Unknown"}</span><span className="tabular-nums">{e.count}</span></li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
