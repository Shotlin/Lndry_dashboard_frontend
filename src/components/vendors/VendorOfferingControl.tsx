"use client"

import { useEffect, useState } from "react"
import { Smartphone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { useSetVendorOffering } from "@/hooks/useVendorDetail"
import type { PosOnboardingStatus, VendorOffering } from "@/services/vendors.service"

export const OFFERING_LABEL: Record<VendorOffering, string> = {
  MARKETPLACE: "Marketplace",
  POS: "POS only",
  BOTH: "Marketplace + POS",
}

const DESCRIPTION: Record<VendorOffering, string> = {
  MARKETPLACE: "Gets customers from the LNDRY customer app. No POS mode in the Vendor App.",
  POS: "Counter billing and CRM only. Not listed in the customer app; marketplace screens are hidden.",
  BOTH: "Can use both. The owner switches between Marketplace and POS in the app's Settings.",
}

const CONFIRM_NOTE: Record<VendorOffering, string> = {
  MARKETPLACE:
    "The Vendor App will show the marketplace only. POS data is kept, not deleted, and comes back if POS is turned on again.",
  POS: "The Vendor App will show POS only once the owner has finished POS setup. Marketplace screens will be hidden for this vendor.",
  BOTH: "The owner will be able to switch between Marketplace and POS in Settings. If POS setup is not finished yet, the app asks them to finish it first.",
}

const STATUS_LABEL: Record<PosOnboardingStatus, string> = {
  NOT_STARTED: "POS setup not started",
  IN_PROGRESS: "POS setup in progress",
  COMPLETED: "POS setup complete",
}

export function VendorOfferingBadge({ offering }: { offering?: VendorOffering }) {
  if (!offering) return <span className="text-slate-400">—</span>
  const tone =
    offering === "MARKETPLACE"
      ? "bg-muted text-muted-foreground"
      : offering === "POS"
        ? "bg-brand-50 text-brand-500"
        : "bg-info-bg text-info"
  return <Badge className={`${tone} border-0 px-2.5 py-0.5`}>{OFFERING_LABEL[offering].toUpperCase()}</Badge>
}

interface Props {
  vendorId: string
  offering: VendorOffering
  onboardingStatus?: PosOnboardingStatus
  planName?: string | null
  validTo?: string | null
}

/**
 * Admin control for which LNDRY products a vendor may use in the Vendor App
 * (Marketplace / POS only / Both) plus the POS plan label and validity shown on the POS Home card.
 * This is NOT the vendor "Type" (Standard / Partner / Exclusive), which only controls POS walk-in
 * sync and wallet access. The backend validates and audits every change.
 */
export function VendorOfferingControl({ vendorId, offering, onboardingStatus, planName, validTo }: Props) {
  const save = useSetVendorOffering(vendorId)
  const [draftOffering, setDraftOffering] = useState<VendorOffering>(offering)
  const [draftPlan, setDraftPlan] = useState(planName ?? "")
  const [draftValidTo, setDraftValidTo] = useState(validTo ?? "")
  const [confirming, setConfirming] = useState(false)

  // Follow the server after a save / refetch.
  useEffect(() => setDraftOffering(offering), [offering])
  useEffect(() => setDraftPlan(planName ?? ""), [planName])
  useEffect(() => setDraftValidTo(validTo ?? ""), [validTo])

  const dirty = draftOffering !== offering || draftPlan.trim() !== (planName ?? "") || draftValidTo !== (validTo ?? "")
  const offeringChanged = draftOffering !== offering
  const submit = () => save.mutate({ offering: draftOffering, pos_plan_name: draftPlan, pos_valid_to: draftValidTo })

  return (
    <>
      <div className="flex flex-col gap-2 rounded-xl border px-3 py-2 sm:min-w-[300px]" data-testid="vendor-offering-control">
        <div className="flex items-center gap-2">
          <Smartphone className="h-3.5 w-3.5 text-brand-500" />
          <span className="text-xs font-semibold text-foreground">App access</span>
          <Select value={draftOffering} disabled={save.isPending} onValueChange={(v) => setDraftOffering(v as VendorOffering)}>
            <SelectTrigger className="ml-auto h-8 w-[160px] text-xs font-semibold" aria-label="App access">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(OFFERING_LABEL) as VendorOffering[]).map((o) => (
                <SelectItem key={o} value={o}>
                  {OFFERING_LABEL[o]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">{DESCRIPTION[draftOffering]}</p>
        {onboardingStatus && offering !== "MARKETPLACE" && (
          <p className="text-[11px] font-medium text-foreground">{STATUS_LABEL[onboardingStatus]}</p>
        )}
        {draftOffering !== "MARKETPLACE" && (
          <div className="flex flex-col gap-1.5 sm:flex-row">
            <Input
              value={draftPlan}
              maxLength={100}
              disabled={save.isPending}
              onChange={(e) => setDraftPlan(e.target.value)}
              placeholder="POS plan name (optional)"
              aria-label="POS plan name"
              className="h-8 text-xs"
            />
            <Input
              type="date"
              value={draftValidTo}
              disabled={save.isPending}
              onChange={(e) => setDraftValidTo(e.target.value)}
              aria-label="POS plan valid until"
              className="h-8 text-xs sm:w-[150px]"
            />
          </div>
        )}
        <Button
          size="sm"
          className="h-8 self-end text-xs"
          disabled={!dirty || save.isPending}
          onClick={() => (offeringChanged ? setConfirming(true) : submit())}
        >
          {save.isPending ? "Saving…" : "Save"}
        </Button>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change app access to {OFFERING_LABEL[draftOffering]}?</AlertDialogTitle>
            <AlertDialogDescription>{CONFIRM_NOTE[draftOffering]}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                submit()
                setConfirming(false)
              }}
            >
              Change access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
