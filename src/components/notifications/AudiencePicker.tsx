"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useCustomerSegments } from "@/hooks/useCustomerSegments"
import { RecipientSearch } from "./RecipientSearch"
import type { AudienceSpec, Recipient } from "@/types/notification.types"

export type AudienceChoice =
  | "ALL_CUSTOMERS"
  | "ALL_VENDORS"
  | "ALL_CAPTAINS"
  | "CUSTOMER"
  | "VENDOR"
  | "VENDOR_CAPTAINS"
  | "CAPTAIN"
  | "SEGMENT"
  | "LOCATION"

export interface AudienceState {
  choice: AudienceChoice | ""
  recipient: Recipient | null
  segmentId: string
  target: "customers" | "vendors" | "captains"
  city: string
  pincode: string
}

export const EMPTY_AUDIENCE: AudienceState = {
  choice: "", recipient: null, segmentId: "", target: "customers", city: "", pincode: "",
}

const OPTIONS: { value: AudienceChoice; label: string; group: string }[] = [
  { value: "ALL_CUSTOMERS", label: "All customers", group: "Everyone" },
  { value: "ALL_VENDORS", label: "All vendors (owners & staff)", group: "Everyone" },
  { value: "ALL_CAPTAINS", label: "All riders / captains", group: "Everyone" },
  { value: "CUSTOMER", label: "A specific customer", group: "One person" },
  { value: "VENDOR", label: "A specific vendor (owner & staff)", group: "One person" },
  { value: "VENDOR_CAPTAINS", label: "All captains of one vendor", group: "One person" },
  { value: "CAPTAIN", label: "A specific rider / captain", group: "One person" },
  { value: "SEGMENT", label: "A customer segment", group: "Groups" },
  { value: "LOCATION", label: "Customers / vendors / captains in an area", group: "Groups" },
]

/** The saved audience spec, or null while the choice is still incomplete. */
export function toAudienceSpec(s: AudienceState): AudienceSpec | null {
  switch (s.choice) {
    case "ALL_CUSTOMERS":
    case "ALL_VENDORS":
    case "ALL_CAPTAINS":
      return { kind: s.choice }
    case "CUSTOMER":
    case "CAPTAIN":
      return s.recipient ? { kind: "USER", userId: s.recipient.id } : null
    case "VENDOR":
      return s.recipient ? { kind: "VENDOR", vendorId: s.recipient.id } : null
    case "VENDOR_CAPTAINS":
      return s.recipient ? { kind: "VENDOR_CAPTAINS", vendorId: s.recipient.id } : null
    case "SEGMENT":
      return s.segmentId ? { kind: "SEGMENT", segmentId: s.segmentId } : null
    case "LOCATION":
      return s.city.trim() || s.pincode.trim()
        ? { kind: "LOCATION", target: s.target, ...(s.city.trim() ? { city: s.city.trim() } : {}), ...(s.pincode.trim() ? { pincode: s.pincode.trim() } : {}) }
        : null
    default:
      return null
  }
}

/** Rebuild the picker state from a saved spec (editing a draft). */
export function audienceStateFromSpec(spec: AudienceSpec | null | undefined): AudienceState {
  if (!spec) return EMPTY_AUDIENCE
  switch (spec.kind) {
    case "ALL_CUSTOMERS": case "ALL_VENDORS": case "ALL_CAPTAINS":
      return { ...EMPTY_AUDIENCE, choice: spec.kind }
    case "SEGMENT":
      return { ...EMPTY_AUDIENCE, choice: "SEGMENT", segmentId: spec.segmentId ?? "" }
    case "LOCATION":
      return { ...EMPTY_AUDIENCE, choice: "LOCATION", target: spec.target ?? "customers", city: spec.city ?? "", pincode: spec.pincode ?? "" }
    default:
      // A specific person / vendor cannot be rebuilt without a lookup; the admin re-picks.
      return EMPTY_AUDIENCE
  }
}

export function audienceLabel(spec: AudienceSpec | null | undefined): string {
  if (!spec) return "—"
  switch (spec.kind) {
    case "ALL_CUSTOMERS": return "All customers"
    case "ALL_VENDORS": return "All vendors"
    case "ALL_CAPTAINS": return "All captains"
    case "USER": return "One person"
    case "VENDOR": return "One vendor"
    case "VENDOR_CAPTAINS": return "A vendor's captains"
    case "SEGMENT": return "Customer segment"
    case "LOCATION": {
      const who = spec.target === "captains" ? "Captains" : spec.target === "vendors" ? "Vendors" : "Customers"
      return `${who} in ${[spec.city, spec.pincode].filter(Boolean).join(" ")}`
    }
    default: return spec.kind
  }
}

interface Props {
  value: AudienceState
  onChange: (next: AudienceState) => void
}

export function AudiencePicker({ value, onChange }: Props) {
  const { data: segments } = useCustomerSegments()
  const set = (patch: Partial<AudienceState>) => onChange({ ...value, ...patch })
  const groups = Array.from(new Set(OPTIONS.map((o) => o.group)))
  const searchType = value.choice === "VENDOR" || value.choice === "VENDOR_CAPTAINS" ? "vendor"
    : value.choice === "CAPTAIN" ? "captain" : "customer"

  return (
    <div className="space-y-3">
      <Select
        value={value.choice || undefined}
        onValueChange={(v) => onChange({ ...EMPTY_AUDIENCE, choice: v as AudienceChoice })}
      >
        <SelectTrigger className="h-10 rounded-xl text-[13px]"><SelectValue placeholder="Choose who receives this…" /></SelectTrigger>
        <SelectContent>
          {groups.map((g) => (
            <div key={g}>
              <p className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">{g}</p>
              {OPTIONS.filter((o) => o.group === g).map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>

      {["CUSTOMER", "CAPTAIN", "VENDOR", "VENDOR_CAPTAINS"].includes(value.choice) && (
        <RecipientSearch
          type={searchType}
          value={value.recipient}
          onChange={(recipient) => set({ recipient })}
          placeholder={searchType === "vendor" ? "Search vendor by name, city or pincode" : "Search by name, phone or email"}
        />
      )}

      {value.choice === "SEGMENT" && (
        <Select value={value.segmentId || undefined} onValueChange={(v) => set({ segmentId: v })}>
          <SelectTrigger className="h-10 rounded-xl text-[13px]"><SelectValue placeholder="Choose a segment…" /></SelectTrigger>
          <SelectContent>
            {(segments ?? []).length === 0 ? (
              <p className="px-3 py-2 text-[12px] text-[#64748b]">No segments yet — create one under Customer Segments.</p>
            ) : (
              (segments ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name} · {s.member_count}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}

      {value.choice === "LOCATION" && (
        <div className="space-y-2.5">
          <Select value={value.target} onValueChange={(v) => set({ target: v as AudienceState["target"] })}>
            <SelectTrigger className="h-10 rounded-xl text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="customers">Customers (by saved address)</SelectItem>
              <SelectItem value="vendors">Vendors (by shop location)</SelectItem>
              <SelectItem value="captains">Captains (by their vendor&apos;s location)</SelectItem>
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label className="text-[12px]">City</Label>
              <Input value={value.city} onChange={(e) => set({ city: e.target.value })} placeholder="e.g. Kolkata" className="h-10 rounded-xl text-[13px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px]">Pincode</Label>
              <Input value={value.pincode} onChange={(e) => set({ pincode: e.target.value })} placeholder="e.g. 700001" className="h-10 rounded-xl text-[13px]" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
