"use client"

import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { LINK_PRESETS, presetsFor, type TargetApp } from "./deep-links"
import type { DeepLink, LinkType } from "@/types/notification.types"

const NONE = "__none__"

interface Props {
  value: DeepLink | null
  onChange: (link: DeepLink | null) => void
  /** Limits the presets to screens that exist in that app. */
  app?: TargetApp | null
}

/** Where a tap on the notification opens. Order/vendor destinations take the
 * matching ID; "Custom app route" takes an in-app path. */
export function DeepLinkField({ value, onChange, app = null }: Props) {
  const presets = presetsFor(app)
  const current = value?.type ? LINK_PRESETS.find((p) => p.value === value.type) : undefined
  const paramKey = current?.needs

  return (
    <div className="space-y-2.5">
      <Select
        value={value?.type ?? NONE}
        onValueChange={(v) => onChange(v === NONE ? null : { type: v as LinkType, params: {} })}
      >
        <SelectTrigger className="h-10 rounded-xl text-[13px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>None — just open the app</SelectItem>
          {presets.map((p) => (
            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {paramKey && (
        <Input
          value={value?.params?.[paramKey] ?? ""}
          onChange={(e) => onChange({ type: value!.type, params: { [paramKey]: e.target.value } })}
          placeholder={
            paramKey === "orderId" ? "Order ID (the long ID from the order page)"
            : paramKey === "vendorId" ? "Vendor ID"
            : "/profile/wallet"
          }
          className="h-10 rounded-xl text-[13px]"
        />
      )}
      {current && <p className="text-[12px] text-[#64748b]">{current.hint}. If the person is signed out they sign in first and then land here.</p>}
    </div>
  )
}
