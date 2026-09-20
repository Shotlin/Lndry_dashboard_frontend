"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  BellRing, CheckCircle2, FlaskConical, Loader2, RotateCcw, Search, ShieldAlert, Smartphone, XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { formatDateTime } from "@/lib/utils"
import {
  useLifecycleEvents, useLifecycleLog, useResetLifecycleEvent, useSaveLifecycleEvent, useTestLifecycleEvent,
} from "@/hooks/useNotifications"
import { ImageField } from "./ImageField"
import { RecipientSearch } from "./RecipientSearch"
import type {
  LifecycleEvent, LifecycleLogStatus, LifecycleRecipient, LinkType, Recipient,
} from "@/types/notification.types"

/** Realistic values so the preview reads like a real notification. */
const SAMPLE: Record<string, string> = {
  customerName: "Sayan",
  vendorName: "Shotlin Laundry",
  captainName: "Sanu",
  orderId: "LNDR-20260920-7DE",
  pickupDate: "21 Sep",
  pickupSlot: "10:00 AM – 12:00 PM",
  amount: "250",
  remainingAmount: "150",
  otp: "482913",
  reason: "The laundry is fully booked.",
}
const TOKEN = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g

function renderSample(text: string) {
  return text
    .replace(TOKEN, (_, name: string) => SAMPLE[name] ?? "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .trim()
}

const LINKS: { value: LinkType | "none"; label: string }[] = [
  { value: "order_details", label: "Order details" },
  { value: "order_tracking", label: "Order tracking" },
  { value: "order_approval", label: "Re-evaluation approval" },
  { value: "order_payment", label: "Payment for the order" },
  { value: "order_review", label: "Completed order / review" },
  { value: "orders", label: "Orders list" },
  { value: "home", label: "Home" },
  { value: "notifications", label: "Notifications" },
  { value: "wallet", label: "Wallet" },
  { value: "help", label: "Help & support" },
  { value: "profile", label: "Profile" },
  { value: "route", label: "Custom app route" },
  { value: "none", label: "None — just open the app" },
]

const RECIPIENTS: { value: LifecycleRecipient; label: string }[] = [
  { value: "CUSTOMER", label: "Customer (Customer app)" },
  { value: "VENDOR", label: "Laundry partner (Partner app)" },
  { value: "CAPTAIN", label: "Captain (Partner app)" },
]

const GROUPS: LifecycleEvent["group"][] = ["Customer", "Vendor", "Captain"]

const STATUS_STYLE: Record<LifecycleLogStatus, string> = {
  SENT: "bg-[#ECFDF5] text-[#047857]",
  PARTIAL: "bg-[#FFFBEB] text-[#B45309]",
  FAILED: "bg-[#FEF2F2] text-[#B91C1C]",
  NO_DEVICE: "bg-[#F1F5F9] text-[#475569]",
  SKIPPED: "bg-[#F1F1F5] text-[#64748B]",
  PENDING: "bg-[#EFF6FF] text-[#1D4ED8]",
}
const STATUS_LABEL: Record<LifecycleLogStatus, string> = {
  SENT: "Sent", PARTIAL: "Partly sent", FAILED: "Failed", NO_DEVICE: "No device", SKIPPED: "Skipped", PENDING: "In progress",
}

/** Order Lifecycle: every automatic order notification, editable, plus its delivery log. */
export function OrderLifecycleTab() {
  const [view, setView] = useState<"messages" | "log">("messages")
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-[13px] text-[#64748b]">
          These notifications are sent automatically as an order moves through its journey — separate from marketing campaigns.
          Edit the wording, turn a message off, or change where a tap opens; new orders use your changes immediately, with no app update.
        </p>
        <div className="inline-flex rounded-full bg-[#f1f1f5] p-1">
          {([["messages", "Messages"], ["log", "Delivery log"]] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 text-[12px] font-bold transition-colors ${view === v ? "bg-white text-[#6366F1] shadow-sm" : "text-[#64748b]"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {view === "messages" ? <MessagesView /> : <LogView />}
    </div>
  )
}

/* ───────────────────────── Messages ───────────────────────── */

function MessagesView() {
  const { data, isLoading, isError, refetch } = useLifecycleEvents()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const events = useMemo(() => data ?? [], [data])
  const selected = events.find((e) => e.eventKey === selectedKey) ?? null

  useEffect(() => {
    if (!selectedKey && events.length) setSelectedKey(events[0].eventKey)
  }, [events, selectedKey])

  if (isLoading) {
    return <div className="grid gap-4 lg:grid-cols-[300px_1fr]"><Skeleton className="h-96 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div>
  }
  if (isError) {
    return (
      <div className="lndry-card py-10 text-center">
        <p className="mb-3 text-[13px] text-[#B91C1C]">Could not load the lifecycle notifications.</p>
        <Button variant="outline" className="rounded-full" onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[310px_1fr]">
      <div className="lndry-card max-h-[75vh] overflow-y-auto !p-3">
        {GROUPS.map((g) => (
          <div key={g} className="mb-3 last:mb-0">
            <p className="px-2 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">{g} messages</p>
            {events.filter((e) => e.group === g).map((e) => (
              <button
                key={e.eventKey}
                onClick={() => setSelectedKey(e.eventKey)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors ${selectedKey === e.eventKey ? "bg-[#6366F1] text-white" : "hover:bg-[#f4f4f8]"}`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${e.enabled ? "bg-[#10B981]" : "bg-[#94a3b8]"}`} title={e.enabled ? "On" : "Off"} />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[13px] font-semibold ${selectedKey === e.eventKey ? "text-white" : "text-[#334155]"}`}>{e.label}</span>
                  <span className={`block truncate text-[11px] ${selectedKey === e.eventKey ? "text-white/75" : "text-[#94a3b8]"}`}>{e.trigger}</span>
                </span>
                {e.isCustom && (
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${selectedKey === e.eventKey ? "bg-white/20 text-white" : "bg-[#EEF2FF] text-[#4F46E5]"}`}>Edited</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      {selected ? <EventEditor key={selected.eventKey + (selected.updatedAt ?? "")} event={selected} /> : (
        <div className="lndry-card flex items-center justify-center py-16 text-[13px] text-[#7e8998]">Select a notification to edit it</div>
      )}
    </div>
  )
}

function EventEditor({ event }: { event: LifecycleEvent }) {
  const save = useSaveLifecycleEvent()
  const reset = useResetLifecycleEvent()
  const [title, setTitle] = useState(event.title)
  const [body, setBody] = useState(event.body)
  const [enabled, setEnabled] = useState(event.enabled)
  const [recipient, setRecipient] = useState<LifecycleRecipient>(event.recipientType)
  const [linkType, setLinkType] = useState<LinkType | "none">(event.linkType ?? "none")
  const [route, setRoute] = useState(event.linkParams?.route ?? "")
  const [image, setImage] = useState<string | undefined>(event.imageUrl ?? undefined)
  const [testOpen, setTestOpen] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const lastField = useRef<"title" | "body">("body")

  const allowed = useMemo(() => new Set(event.placeholders.map((p) => p.name)), [event.placeholders])
  const unknown = useMemo(() => {
    const found = new Set<string>()
    for (const m of `${title} ${body}`.matchAll(TOKEN)) if (!allowed.has(m[1])) found.add(m[1])
    return [...found]
  }, [title, body, allowed])

  const dirty =
    title !== event.title || body !== event.body || enabled !== event.enabled ||
    recipient !== event.recipientType || (linkType === "none" ? null : linkType) !== event.linkType ||
    route !== (event.linkParams?.route ?? "") || (image ?? "") !== (event.imageUrl ?? "")
  const routeProblem = linkType === "route" && !(route.startsWith("/") && !route.startsWith("//") && !route.includes("://") && !route.includes(".."))
    ? "Enter an in-app path such as /profile/wallet." : null
  const canSave = dirty && !!title.trim() && !!body.trim() && unknown.length === 0 && !routeProblem && !save.isPending

  function insert(name: string) {
    const token = `{{${name}}}`
    const inTitle = lastField.current === "title"
    const el = inTitle ? titleRef.current : bodyRef.current
    const value = inTitle ? title : body
    const set = inTitle ? setTitle : setBody
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    set(value.slice(0, start) + token + value.slice(end))
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  function onSave() {
    save.mutate({
      eventKey: event.eventKey,
      payload: {
        title: title.trim(), body: body.trim(), enabled, recipient_type: recipient,
        link: linkType === "none" ? null : { type: linkType, ...(linkType === "route" ? { params: { route } } : {}) },
        image_url: image ?? null,
      },
    })
  }

  return (
    <div className="lndry-card space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-[#080f14]">{event.label}</h2>
          <p className="text-[12px] text-[#64748b]">Sent when: {event.trigger}</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#e8e8ef] px-3 py-2">
          <div>
            <p className="text-[13px] font-semibold text-[#0f172a]">{enabled ? "Enabled" : "Disabled"}</p>
            <p className="text-[11px] text-[#64748b]">{enabled ? "Sent automatically" : "Not sent (still logged)"}</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_290px]">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lc-title">Notification title</Label>
            <Input id="lc-title" ref={titleRef} value={title} maxLength={120} onFocus={() => (lastField.current = "title")} onChange={(e) => setTitle(e.target.value)} className="h-10 rounded-xl text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lc-body">Message</Label>
            <Textarea id="lc-body" ref={bodyRef} value={body} rows={3} maxLength={400} onFocus={() => (lastField.current = "body")} onChange={(e) => setBody(e.target.value)} className="rounded-xl text-[13px]" />
          </div>

          <div className="space-y-1.5">
            <Label>Insert a placeholder</Label>
            <div className="flex flex-wrap gap-1.5">
              {event.placeholders.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  title={p.description}
                  onClick={() => insert(p.name)}
                  className="rounded-full border border-[#6366F1]/40 px-2.5 py-1 text-[11px] font-bold text-[#6366F1] hover:bg-[#EEF2FF]"
                >
                  {`{{${p.name}}}`}
                </button>
              ))}
            </div>
            <p className="text-[12px] text-[#64748b]">Filled with the real order&apos;s details when the notification is sent. Click one to add it where you were typing.</p>
            {unknown.length > 0 && (
              <p className="text-[12px] font-semibold text-[#B91C1C]">Not available here: {unknown.map((u) => `{{${u}}}`).join(", ")} — remove or fix before saving.</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Sent to</Label>
              <Select value={recipient} onValueChange={(v) => setRecipient(v as LifecycleRecipient)}>
                <SelectTrigger className="h-10 rounded-xl text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>{RECIPIENTS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>When tapped, open</Label>
              <Select value={linkType} onValueChange={(v) => setLinkType(v as LinkType | "none")}>
                <SelectTrigger className="h-10 rounded-xl text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>{LINKS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {linkType === "route" && (
            <div className="space-y-1">
              <Input value={route} onChange={(e) => setRoute(e.target.value)} placeholder="/profile/wallet" className="h-10 rounded-xl text-[13px]" />
              {routeProblem && <p className="text-[12px] text-[#B91C1C]">{routeProblem}</p>}
            </div>
          )}
          {linkType !== "route" && linkType !== "none" && (
            <p className="text-[12px] text-[#64748b]">Opens that exact order in the app. If the person is signed out they sign in first and then land there.</p>
          )}

          <div className="space-y-1.5">
            <Label>Image <span className="font-normal text-[#94a3b8]">(optional)</span></Label>
            <ImageField value={image} onChange={setImage} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-[#e8e8ef] bg-[#fafafd] p-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Preview with sample order</p>
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2 text-[11px] text-[#94a3b8]">
                <span className="grid h-4 w-4 place-items-center rounded bg-[#6366F1] text-[9px] font-bold text-white">L</span>
                LNDRY · now
              </div>
              <p className="mt-1.5 text-[13px] font-bold text-[#0f172a]">{renderSample(title) || "Title"}</p>
              <p className="mt-0.5 whitespace-pre-line text-[12px] text-[#475569]">{renderSample(body) || "Message"}</p>
              {image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" className="mt-2 h-24 w-full rounded-lg object-cover" />
              )}
            </div>
          </div>
          {event.isCustom && (
            <div className="rounded-xl border border-[#e8e8ef] p-3 text-[12px] text-[#64748b]">
              <p className="mb-1 font-bold text-[#334155]">Built-in wording</p>
              <p className="font-semibold text-[#475569]">{event.defaultTitle}</p>
              <p>{event.defaultBody}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f0f5] pt-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setTestOpen(true)}>
            <FlaskConical className="mr-1.5 h-3.5 w-3.5" /> Send test
          </Button>
          {event.isCustom && (
            <Button
              variant="outline" size="sm" className="rounded-full" disabled={reset.isPending}
              onClick={() => { if (window.confirm("Discard your version and go back to the built-in wording?")) reset.mutate(event.eventKey) }}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset to default
            </Button>
          )}
        </div>
        <Button className="rounded-full bg-[#6366F1] px-5 font-bold text-white hover:bg-[#4F46E5]" disabled={!canSave} onClick={onSave}>
          {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save changes
        </Button>
      </div>

      <TestDialog eventKey={event.eventKey} label={event.label} open={testOpen} onOpenChange={setTestOpen} />
    </div>
  )
}

function TestDialog({ eventKey, label, open, onOpenChange }: { eventKey: string; label: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const test = useTestLifecycleEvent()
  const [recipient, setRecipient] = useState<Recipient | null>(null)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => { if (open) { setRecipient(null); setResult(null) } }, [open])

  const OUTCOME: Record<string, { text: string; ok: boolean }> = {
    SENT: { text: "Sent successfully to their device(s).", ok: true },
    NO_DEVICE: { text: "No registered device — this person has not opened the app with notifications on.", ok: false },
    INVALID_TOKEN: { text: "Their stored device token is no longer valid.", ok: false },
    FAILED: { text: "Firebase could not deliver it.", ok: false },
    NOT_CONFIGURED: { text: "The server has no Firebase credentials configured.", ok: false },
  }
  const o = result ? OUTCOME[result] : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send a test of “{label}”</DialogTitle>
          <DialogDescription>Uses the wording currently saved, filled with sample order data, and is marked [Test].</DialogDescription>
        </DialogHeader>
        <RecipientSearch type="any" value={recipient} onChange={(r) => { setRecipient(r); setResult(null) }} />
        {o && (
          <div className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-[13px] ${o.ok ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]" : "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]"}`}>
            {o.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />}
            {o.text}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>Close</Button>
          <Button
            className="rounded-full bg-[#6366F1] px-5 font-bold text-white hover:bg-[#4F46E5]"
            disabled={!recipient || test.isPending}
            onClick={() => recipient && test.mutate({ eventKey, userId: recipient.id }, { onSuccess: (r) => setResult(r.status) })}
          >
            {test.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellRing className="mr-2 h-4 w-4" />}Send test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ───────────────────────── Delivery log ───────────────────────── */

const PAGE = 20

function LogView() {
  const { data: events } = useLifecycleEvents()
  const [page, setPage] = useState(1)
  const [event, setEvent] = useState("ALL")
  const [status, setStatus] = useState<LifecycleLogStatus | "ALL">("ALL")
  const [order, setOrder] = useState("")
  const [orderDraft, setOrderDraft] = useState("")

  useEffect(() => {
    const t = setTimeout(() => { setOrder(orderDraft.trim()); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [orderDraft])

  const { data, isLoading, isError, refetch, isFetching } = useLifecycleLog({
    page, limit: PAGE,
    ...(event !== "ALL" ? { event } : {}),
    ...(status !== "ALL" ? { status } : {}),
    ...(order ? { order } : {}),
  })
  const rows = data?.events ?? []
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
          <Input value={orderDraft} onChange={(e) => setOrderDraft(e.target.value)} placeholder="Order number" className="h-9 w-52 rounded-full pl-9 text-[13px]" />
        </div>
        <Select value={event} onValueChange={(v) => { setEvent(v); setPage(1) }}>
          <SelectTrigger className="h-9 w-60 rounded-full text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All notifications</SelectItem>
            {(events ?? []).map((e) => <SelectItem key={e.eventKey} value={e.eventKey}>{e.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v as LifecycleLogStatus | "ALL"); setPage(1) }}>
          <SelectTrigger className="h-9 w-40 rounded-full text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All results</SelectItem>
            {(Object.keys(STATUS_LABEL) as LifecycleLogStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => refetch()} disabled={isFetching}>Refresh</Button>
      </div>

      <div className="lndry-card !p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead><TableHead>Notification</TableHead><TableHead>Order</TableHead>
              <TableHead>Recipient</TableHead><TableHead>App</TableHead><TableHead>Result</TableHead>
              <TableHead className="text-right">Devices</TableHead><TableHead className="text-right">Opened</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
            ) : isError ? (
              <TableRow><TableCell colSpan={8} className="py-10 text-center text-[13px] text-[#B91C1C]">Could not load the log. <button className="font-semibold underline" onClick={() => refetch()}>Retry</button></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-[13px] text-[#7e8998]">Nothing has been sent yet. Entries appear here as orders move through their journey.</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap text-[12px] text-[#475569]">{formatDateTime(r.sent_at ?? r.created_at)}</TableCell>
                <TableCell className="max-w-[240px]">
                  <p className="truncate text-[13px] font-semibold text-[#0f172a]">{r.label}</p>
                  <p className="truncate text-[11px] text-[#94a3b8]">{r.title}</p>
                </TableCell>
                <TableCell className="whitespace-nowrap text-[12px] font-semibold text-[#334155]">{r.order_number ?? "—"}</TableCell>
                <TableCell>
                  <p className="text-[12px] text-[#0f172a]">{r.recipient_name ?? "—"}</p>
                  <p className="text-[11px] capitalize text-[#94a3b8]">{r.recipient_type.toLowerCase()}{r.recipient_phone ? ` · ${r.recipient_phone}` : ""}</p>
                </TableCell>
                <TableCell className="whitespace-nowrap text-[12px] text-[#475569]">
                  {r.apps ? r.apps.split(",").map((a) => (a === "partner" ? "Partner" : "Customer")).join(", ") : "—"}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[r.status]}`}>
                    {r.status === "SENT" ? <CheckCircle2 className="h-3 w-3" /> : r.status === "FAILED" ? <XCircle className="h-3 w-3" /> : r.status === "NO_DEVICE" ? <Smartphone className="h-3 w-3" /> : null}
                    {STATUS_LABEL[r.status]}
                  </span>
                  {(r.skip_reason || r.error_summary) && (
                    <p className="mt-0.5 max-w-[180px] truncate text-[11px] text-[#94a3b8]" title={r.skip_reason ?? r.error_summary ?? ""}>
                      {r.skip_reason === "DISABLED" ? "Turned off in Order Lifecycle" : r.error_summary}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-right text-[13px] tabular-nums">{r.devices_sent}/{r.devices_total}</TableCell>
                <TableCell className="text-right text-[13px] tabular-nums">{r.opened}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-[12px] text-[#64748b]">
          <span>{(data?.total ?? 0).toLocaleString()} notifications</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span>Page {page} of {pages}</span>
            <Button variant="outline" size="sm" className="rounded-full" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
      <p className="text-[11px] text-[#94a3b8]">One-time codes are never stored in this log — they show as ••••••.</p>
    </div>
  )
}
