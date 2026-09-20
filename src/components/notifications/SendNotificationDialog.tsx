"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, BellRing, CalendarClock, Loader2, Send, Smartphone, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  useAudienceCount, useCreateCampaign, useSendDraft, useTemplates, useUpdateDraft,
} from "@/hooks/useNotifications"
import { AudiencePicker, EMPTY_AUDIENCE, audienceStateFromSpec, toAudienceSpec, type AudienceState } from "./AudiencePicker"
import { DeepLinkField } from "./DeepLinkField"
import { ImageField } from "./ImageField"
import { appForAudience, linkProblem } from "./deep-links"
import type { DeepLink, NotificationCampaign, NotificationTemplate } from "@/types/notification.types"

export type SendMode = "now" | "schedule"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMode?: SendMode
  /** Pre-fill from a template (everything stays editable). */
  template?: NotificationTemplate | null
  /** Continue editing a saved draft. */
  draft?: NotificationCampaign | null
}

const NO_TEMPLATE = "__none__"

/** datetime-local value for "now + minutes" in the browser's timezone. */
function localInput(minutesFromNow: number) {
  const d = new Date(Date.now() + minutesFromNow * 60_000)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function linkFromTemplate(t: NotificationTemplate): DeepLink | null {
  return t.deep_link_type ? { type: t.deep_link_type, params: t.deep_link_params ?? {} } : null
}

export function SendNotificationDialog({ open, onOpenChange, initialMode = "now", template, draft }: Props) {
  const { data: templates } = useTemplates()
  const createCampaign = useCreateCampaign()
  const updateDraft = useUpdateDraft()
  const sendDraft = useSendDraft()

  const [templateId, setTemplateId] = useState<string>(NO_TEMPLATE)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [image, setImage] = useState<string | undefined>()
  const [link, setLink] = useState<DeepLink | null>(null)
  const [audience, setAudience] = useState<AudienceState>(EMPTY_AUDIENCE)
  const [expiry, setExpiry] = useState("")
  const [mode, setMode] = useState<SendMode>(initialMode)
  const [scheduledAt, setScheduledAt] = useState("")
  const [touched, setTouched] = useState(false)

  // (Re)initialise every time the dialog opens.
  useEffect(() => {
    if (!open) return
    setTouched(false)
    setMode(initialMode)
    setScheduledAt(localInput(60))
    setExpiry("")
    if (draft) {
      setTemplateId(draft.template_id ?? NO_TEMPLATE)
      setTitle(draft.title)
      setBody(draft.body)
      setImage(draft.image_url ?? undefined)
      setLink(draft.deep_link_type ? { type: draft.deep_link_type, params: draft.deep_link_params ?? {} } : null)
      setAudience(audienceStateFromSpec(draft.audience))
    } else if (template) {
      setTemplateId(template.id)
      setTitle(template.title)
      setBody(template.body)
      setImage(template.image_url ?? undefined)
      setLink(linkFromTemplate(template))
      setAudience(EMPTY_AUDIENCE)
    } else {
      setTemplateId(NO_TEMPLATE)
      setTitle(""); setBody(""); setImage(undefined); setLink(null); setAudience(EMPTY_AUDIENCE)
    }
  }, [open, initialMode, template, draft])

  const spec = useMemo(() => toAudienceSpec(audience), [audience])
  const { data: counts, isFetching: counting, isError: countFailed } = useAudienceCount(spec)
  const targetApp = appForAudience(spec)

  function applyTemplate(id: string) {
    setTemplateId(id)
    const t = (templates ?? []).find((x) => x.id === id)
    if (!t) return
    setTitle(t.title); setBody(t.body); setImage(t.image_url ?? undefined); setLink(linkFromTemplate(t))
  }

  const scheduleDate = new Date(scheduledAt)
  const expiryDate = expiry ? new Date(expiry) : null
  const problems: string[] = []
  if (!title.trim()) problems.push("Add a title.")
  if (!body.trim()) problems.push("Add a message.")
  if (!spec) problems.push("Choose who receives this.")
  const lp = linkProblem(link)
  if (lp) problems.push(lp)
  if (mode === "schedule") {
    if (Number.isNaN(scheduleDate.getTime()) || scheduleDate.getTime() < Date.now() + 60_000) problems.push("Pick a schedule time in the future.")
  }
  if (expiryDate && (Number.isNaN(expiryDate.getTime()) || expiryDate.getTime() <= (mode === "schedule" ? scheduleDate.getTime() : Date.now()))) {
    problems.push("The expiry must be after the send time.")
  }
  const noDevices = mode === "now" && !!spec && !!counts && counts.devices === 0
  const busy = createCampaign.isPending || updateDraft.isPending || sendDraft.isPending

  const payload = () => ({
    title: title.trim(),
    body: body.trim(),
    ...(image ? { image_url: image } : {}),
    link: link?.type ? link : null,
    audience: spec!,
    ...(expiryDate ? { expires_at: expiryDate.toISOString() } : {}),
    ...(templateId !== NO_TEMPLATE ? { template_id: templateId } : {}),
  })

  async function submit(kind: "send" | "draft") {
    setTouched(true)
    if (kind === "draft") {
      if (!title.trim() || !body.trim() || !spec) return
    } else if (problems.length || noDevices) return

    try {
      if (draft) {
        await updateDraft.mutateAsync({ id: draft.id, payload: payload() })
        if (kind === "send") {
          await sendDraft.mutateAsync({
            id: draft.id,
            mode: mode === "schedule" ? "SCHEDULE" : "SEND_NOW",
            ...(mode === "schedule" ? { scheduledAt: scheduleDate.toISOString() } : {}),
          })
        }
      } else {
        await createCampaign.mutateAsync({
          ...payload(),
          mode: kind === "draft" ? "DRAFT" : mode === "schedule" ? "SCHEDULE" : "SEND_NOW",
          ...(kind === "send" && mode === "schedule" ? { scheduledAt: scheduleDate.toISOString() } : {}),
        })
      }
      onOpenChange(false)
    } catch {
      /* the mutation hooks already show the backend's message */
    }
  }

  const templateOptions = (templates ?? []).filter((t) => t.type === "PUSH" && t.is_active !== false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[18px]">
            <BellRing className="h-5 w-5 text-[#6366F1]" />
            {draft ? "Edit draft" : "New notification"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
          {/* ── Form ── */}
          <div className="space-y-5">
            {templateOptions.length > 0 && (
              <div className="space-y-1.5">
                <Label>Template <span className="font-normal text-[#94a3b8]">(optional)</span></Label>
                <Select value={templateId} onValueChange={(v) => (v === NO_TEMPLATE ? setTemplateId(NO_TEMPLATE) : applyTemplate(v))}>
                  <SelectTrigger className="h-10 rounded-xl text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_TEMPLATE}>No template — write it now</SelectItem>
                    {templateOptions.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-[12px] text-[#64748b]">A template only pre-fills the fields below — you can still change everything.</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="n-title">Title</Label>
              <Input id="n-title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 20% off your next wash" className="h-10 rounded-xl text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="n-body">Message</Label>
              <Textarea id="n-body" value={body} maxLength={2000} rows={3} onChange={(e) => setBody(e.target.value)} placeholder="What should people see?" className="rounded-xl text-[13px]" />
            </div>

            <div className="space-y-1.5">
              <Label>Who receives this</Label>
              <AudiencePicker value={audience} onChange={setAudience} />
            </div>

            <div className="space-y-1.5">
              <Label>Image <span className="font-normal text-[#94a3b8]">(optional)</span></Label>
              <ImageField value={image} onChange={setImage} />
            </div>

            <div className="space-y-1.5">
              <Label>When tapped, open</Label>
              <DeepLinkField value={link} onChange={setLink} app={targetApp} />
            </div>

            <div className="space-y-2">
              <Label>Delivery</Label>
              <div className="inline-flex rounded-full bg-[#f1f1f5] p-1">
                {(["now", "schedule"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`rounded-full px-4 py-1.5 text-[12px] font-bold transition-colors ${mode === m ? "bg-white text-[#6366F1] shadow-sm" : "text-[#64748b]"}`}
                  >
                    {m === "now" ? "Send now" : "Schedule"}
                  </button>
                ))}
              </div>
              {mode === "schedule" && (
                <div className="space-y-1">
                  <Input type="datetime-local" value={scheduledAt} min={localInput(1)} onChange={(e) => setScheduledAt(e.target.value)} className="h-10 max-w-xs rounded-xl text-[13px]" />
                  <p className="text-[12px] text-[#64748b]">Sent by the server at this time — it does not matter if this page is closed. Time is in your local timezone.</p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Expires <span className="font-normal text-[#94a3b8]">(optional)</span></Label>
              <Input type="datetime-local" value={expiry} min={localInput(2)} onChange={(e) => setExpiry(e.target.value)} className="h-10 max-w-xs rounded-xl text-[13px]" />
              <p className="text-[12px] text-[#64748b]">If a phone is offline until after this time, the notification is dropped instead of arriving late.</p>
            </div>
          </div>

          {/* ── Preview + reach ── */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#e8e8ef] bg-[#fafafd] p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Preview</p>
              <div className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="flex items-center gap-2 text-[11px] text-[#94a3b8]">
                  <span className="grid h-4 w-4 place-items-center rounded bg-[#6366F1] text-[9px] font-bold text-white">L</span>
                  LNDRY · now
                </div>
                <p className="mt-1.5 text-[13px] font-bold text-[#0f172a]">{title || "Notification title"}</p>
                <p className="mt-0.5 whitespace-pre-line text-[12px] text-[#475569]">{body || "Your message appears here."}</p>
                {image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="mt-2 h-28 w-full rounded-lg object-cover" />
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e8e8ef] p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Reach (real registered devices)</p>
              {!spec ? (
                <p className="text-[12px] text-[#64748b]">Choose an audience to see how many devices will receive this.</p>
              ) : counting && !counts ? (
                <p className="flex items-center gap-2 text-[12px] text-[#64748b]"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Counting…</p>
              ) : countFailed || !counts ? (
                <p className="text-[12px] text-[#B91C1C]">Could not count this audience.</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#0f172a]"><Users className="h-4 w-4 text-[#6366F1]" /> {counts.users.toLocaleString()} {counts.users === 1 ? "person" : "people"}</div>
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#0f172a]"><Smartphone className="h-4 w-4 text-[#6366F1]" /> {counts.devices.toLocaleString()} device{counts.devices === 1 ? "" : "s"}</div>
                  {counts.devices > 0 && (
                    <p className="text-[12px] text-[#64748b]">
                      {[
                        counts.customer_devices ? `${counts.customer_devices} customer app` : null,
                        counts.partner_devices ? `${counts.partner_devices} partner app` : null,
                        counts.android_devices ? `${counts.android_devices} Android` : null,
                        counts.ios_devices ? `${counts.ios_devices} iPhone` : null,
                      ].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {counts.devices === 0 && (
                    <p className="flex items-start gap-1.5 text-[12px] text-[#B45309]">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      No device with notifications enabled matches yet.{mode === "schedule" ? " You can still schedule — devices may register by then." : ""}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {touched && (problems.length > 0 || noDevices) && (
          <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-[12px] text-[#92400E]">
            {[...problems, ...(noDevices ? ["No devices to send to yet."] : [])].map((p) => <p key={p}>• {p}</p>)}
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="outline" className="rounded-full" disabled={busy} onClick={() => submit("draft")}>
            Save draft
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              type="button"
              className="rounded-full bg-[#6366F1] px-5 font-bold text-white hover:bg-[#4F46E5]"
              disabled={busy}
              onClick={() => submit("send")}
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : mode === "schedule" ? <CalendarClock className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
              {mode === "schedule" ? "Schedule" : "Send now"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
