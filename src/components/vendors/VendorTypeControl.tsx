"use client"

import { useState } from "react"
import { Link2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import { useSetVendorType } from "@/hooks/useVendorDetail"
import type { VendorType } from "@/services/vendors.service"

export const VENDOR_TYPE_LABEL: Record<VendorType, string> = {
  STANDARD: "Standard",
  PARTNER: "Partner",
  EXCLUSIVE: "Exclusive",
}

// Every type is a full LNDRY marketplace vendor. The type only controls how their POS
// (in-store / walk-in sales) connects to LNDRY — never their Vendor App or marketplace business.
const DESCRIPTION: Record<VendorType, string> = {
  STANDARD:
    "Full LNDRY marketplace vendor. POS in-store transactions remain independent and cannot access LNDRY customer wallet.",
  PARTNER:
    "Full LNDRY marketplace vendor with connected POS, customer order sync and wallet access.",
  EXCLUSIVE:
    "Full LNDRY marketplace vendor with connected POS, customer order sync and wallet access.",
}

const UNCHANGED_NOTE =
  "Their Vendor App, listed services, LNDRY online orders and customers' normal app payments (including the LNDRY wallet at app checkout) are not affected."

const CONFIRM_NOTE: Record<VendorType, string> = {
  STANDARD: `This only changes the vendor's POS in-store sales: new walk-in sales will stop syncing to the customer's LNDRY app, and the POS will no longer see or use the customer's LNDRY wallet. Sales already synced stay in the customer's history. ${UNCHANGED_NOTE}`,
  PARTNER: `This only changes the vendor's POS in-store sales: new walk-in sales will sync to the customer's LNDRY app, and the POS can see and use the customer's LNDRY wallet. Earlier walk-in sales stay private. ${UNCHANGED_NOTE}`,
  EXCLUSIVE: `This only changes the vendor's POS in-store sales: new walk-in sales will sync to the customer's LNDRY app, and the POS can see and use the customer's LNDRY wallet. Earlier walk-in sales stay private. ${UNCHANGED_NOTE}`,
}

export function VendorTypeBadge({ type }: { type?: VendorType }) {
  if (!type) return <span className="text-slate-400">—</span>
  const tone =
    type === "STANDARD"
      ? "bg-muted text-muted-foreground"
      : type === "PARTNER"
        ? "bg-info-bg text-info"
        : "bg-brand-50 text-brand-500"
  return <Badge className={`${tone} border-0 px-2.5 py-0.5`}>{VENDOR_TYPE_LABEL[type].toUpperCase()}</Badge>
}

/**
 * Admin control for a vendor's type — how deeply their POS walk-in sales connect to LNDRY
 * (order sync + wallet at the counter). It does not limit the vendor's marketplace business.
 * Saved by the backend, which enforces it on every request; the vendor's POS picks it up on its
 * next refresh, with no redeploy.
 */
export function VendorTypeControl({ vendorId, current }: { vendorId: string; current: VendorType }) {
  const setType = useSetVendorType(vendorId)
  const [pending, setPending] = useState<VendorType | null>(null)

  return (
    <>
      <div className="flex flex-col gap-1.5 rounded-xl border px-3 py-2 sm:min-w-[260px]">
        <div className="flex items-center gap-2">
          <Link2 className="h-3.5 w-3.5 text-brand-500" />
          <span className="text-xs font-semibold text-foreground">Vendor Type</span>
          <Select
            value={current}
            disabled={setType.isPending}
            onValueChange={(value) => {
              const next = value as VendorType
              if (next !== current) setPending(next)
            }}
          >
            <SelectTrigger className="ml-auto h-8 w-[130px] text-xs font-semibold" aria-label="Vendor Type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(VENDOR_TYPE_LABEL) as VendorType[]).map((type) => (
                <SelectItem key={type} value={type}>
                  {VENDOR_TYPE_LABEL[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">{DESCRIPTION[current]}</p>
      </div>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Change vendor type to {pending ? VENDOR_TYPE_LABEL[pending] : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>{pending ? CONFIRM_NOTE[pending] : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending) setType.mutate(pending)
                setPending(null)
              }}
            >
              Change type
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
