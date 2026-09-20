"use client"

import { useState } from "react"
import { AlertTriangle, Loader2, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/useDebounce"
import { useRecipientSearch } from "@/hooks/useNotifications"
import type { Recipient, RecipientType } from "@/types/notification.types"

interface Props {
  type: RecipientType
  value: Recipient | null
  onChange: (r: Recipient | null) => void
  placeholder?: string
}

function subtitle(r: Recipient, type: RecipientType) {
  if (type === "vendor") return [r.city, r.pincode].filter(Boolean).join(" · ") || "—"
  return [r.phone, r.email].filter(Boolean).join(" · ") || "—"
}

/** Search real registered people / vendors; each result shows how many devices
 * can actually receive a push right now. */
export function RecipientSearch({ type, value, onChange, placeholder }: Props) {
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)
  const term = useDebounce(q, 300)
  const { data, isFetching } = useRecipientSearch(term, type, open)

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[#e8e8ef] bg-[#fafafd] px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[#0f172a]">{value.name || "Unnamed"}</p>
          <p className="truncate text-[12px] text-[#64748b]">{subtitle(value, type)}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${value.devices > 0 ? "bg-[#ECFDF5] text-[#047857]" : "bg-[#FEF2F2] text-[#B91C1C]"}`}>
          {value.devices} device{value.devices === 1 ? "" : "s"}
        </span>
        <button type="button" onClick={() => onChange(null)} className="text-[#94a3b8] hover:text-[#0f172a]" aria-label="Clear selection">
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
      <Input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder ?? "Search by name, phone or email"}
        className="h-10 rounded-xl pl-9 text-[13px]"
      />
      {open && q.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-[#e8e8ef] bg-white shadow-lg">
          {isFetching && !data ? (
            <div className="flex items-center gap-2 px-3 py-3 text-[12px] text-[#64748b]"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…</div>
          ) : !data || data.length === 0 ? (
            <p className="px-3 py-3 text-[12px] text-[#64748b]">No match found.</p>
          ) : (
            data.map((r) => (
              <button
                key={r.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(r); setQ(""); setOpen(false) }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[#f4f4f8]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[#0f172a]">{r.name || "Unnamed"}</p>
                  <p className="truncate text-[12px] text-[#64748b]">{subtitle(r, type)}</p>
                </div>
                {r.devices > 0 ? (
                  <span className="shrink-0 text-[11px] font-semibold text-[#047857]">{r.devices} device{r.devices === 1 ? "" : "s"}</span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[#B45309]"><AlertTriangle className="h-3 w-3" /> No device</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
