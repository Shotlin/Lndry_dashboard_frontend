"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, Send, ShieldAlert, SmartphoneNfc, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { useSendTest } from "@/hooks/useNotifications"
import { DeepLinkField } from "./DeepLinkField"
import { RecipientSearch } from "./RecipientSearch"
import { linkProblem } from "./deep-links"
import type { DeepLink, Recipient, TestSendResult, TestStatus } from "@/types/notification.types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaults?: { title?: string; body?: string; image_url?: string; link?: DeepLink | null }
}

const OUTCOME: Record<TestStatus, { label: string; detail: string; tone: string; Icon: typeof CheckCircle2 }> = {
  SENT: { label: "Sent successfully", detail: "Firebase accepted the message for this person's device(s).", tone: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]", Icon: CheckCircle2 },
  FAILED: { label: "Failed", detail: "Firebase could not deliver the message. See the device details below.", tone: "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]", Icon: XCircle },
  INVALID_TOKEN: { label: "Invalid token", detail: "The stored device token is no longer valid. It was switched off; the app registers a fresh one the next time it is opened.", tone: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]", Icon: ShieldAlert },
  NO_DEVICE: { label: "No registered device", detail: "This person has not opened the app with notifications enabled, so there is nowhere to send to.", tone: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]", Icon: SmartphoneNfc },
  NOT_CONFIGURED: { label: "Push service not configured", detail: "The server has no Firebase credentials configured.", tone: "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]", Icon: XCircle },
}

export function SendTestDialog({ open, onOpenChange, defaults }: Props) {
  const test = useSendTest()
  const [recipient, setRecipient] = useState<Recipient | null>(null)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [link, setLink] = useState<DeepLink | null>(null)
  const [result, setResult] = useState<TestSendResult | null>(null)

  useEffect(() => {
    if (!open) return
    setRecipient(null); setResult(null)
    setTitle(defaults?.title || "LNDRY test notification")
    setBody(defaults?.body || "This is a test notification from the admin dashboard.")
    setLink(defaults?.link ?? null)
  }, [open, defaults])

  const problem = linkProblem(link)
  const canSend = !!recipient && !!title.trim() && !!body.trim() && !problem

  function run() {
    if (!recipient || !canSend) return
    test.mutate(
      {
        userId: recipient.id,
        title: title.trim(),
        body: body.trim(),
        ...(defaults?.image_url ? { image_url: defaults.image_url } : {}),
        link: link?.type ? link : null,
      },
      { onSuccess: setResult }
    )
  }

  const outcome = result ? OUTCOME[result.status] : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send a test notification</DialogTitle>
          <DialogDescription>
            Pick a registered person. Their current devices are looked up automatically — no token to copy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Send to</Label>
            <RecipientSearch type="any" value={recipient} onChange={(r) => { setRecipient(r); setResult(null) }} placeholder="Search a customer, vendor or captain" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Title</Label>
            <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 rounded-xl text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-body">Message</Label>
            <Textarea id="t-body" value={body} rows={2} onChange={(e) => setBody(e.target.value)} className="rounded-xl text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label>When tapped, open</Label>
            <DeepLinkField value={link} onChange={setLink} />
            {problem && <p className="text-[12px] text-[#B91C1C]">{problem}</p>}
          </div>

          {result && outcome && (
            <div className={`space-y-2 rounded-xl border p-3 ${outcome.tone}`}>
              <div className="flex items-center gap-2 text-[14px] font-bold"><outcome.Icon className="h-4 w-4" /> {outcome.label}</div>
              <p className="text-[12px]">{outcome.detail}</p>
              {result.devices.length > 0 && (
                <ul className="mt-1 space-y-1 border-t border-current/20 pt-2 text-[12px]">
                  {result.devices.map((d, i) => (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <span>{[d.app === "partner" ? "Partner app" : "Customer app", d.platform, d.model].filter(Boolean).join(" · ")}</span>
                      <span className="font-semibold">{d.status === "SENT" ? "Sent" : d.status === "INVALID_TOKEN" ? "Invalid token" : `Failed${d.error ? ` (${d.error})` : ""}`}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>Close</Button>
          <Button className="rounded-full bg-[#6366F1] px-5 font-bold text-white hover:bg-[#4F46E5]" disabled={!canSend || test.isPending} onClick={run}>
            {test.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {result ? "Send again" : "Send test"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
