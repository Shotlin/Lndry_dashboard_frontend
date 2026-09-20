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

const DESCRIPTION: Record<VendorType, string> = {
  STANDARD:
    "Standalone POS only. Counter sales stay in the vendor's own POS and never appear in the LNDRY customer app. No access to LNDRY wallets.",
  PARTNER:
    "Connected to LNDRY. Counter sales appear in the customer's LNDRY app (same phone number) and the LNDRY wallet can be used at the counter.",
  EXCLUSIVE:
    "Same full LNDRY connection as Partner: counter sales sync to the customer app and the LNDRY wallet is available.",
}

const CONFIRM_NOTE: Record<VendorType, string> = {
  STANDARD:
    "New counter sales will stop syncing to the LNDRY customer app and the vendor will lose LNDRY wallet access (lookup, redemption and payment). Sales already synced stay in the customer's history.",
  PARTNER:
    "New counter sales will sync to the customer's LNDRY app and the vendor will get LNDRY wallet access. Earlier POS-only sales stay private.",
  EXCLUSIVE:
    "New counter sales will sync to the customer's LNDRY app and the vendor will get LNDRY wallet access. Earlier POS-only sales stay private.",
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
 * Admin control for a vendor's type. The change is saved by the backend, which
 * enforces it on every request — the vendor's POS picks it up on its next
 * refresh, with no redeploy.
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
