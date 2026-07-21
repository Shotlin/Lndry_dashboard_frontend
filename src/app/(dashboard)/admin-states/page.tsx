"use client"

import { Check, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

const GUIDANCE_CARDS = [
  { title: "Loading", desc: "Use structured skeleton rows and preserve table headers." },
  { title: "Empty queue", desc: "Explain why the queue is empty and show the next relevant action." },
  { title: "Permission denied", desc: "Name the missing permission and do not reveal restricted content." },
  { title: "Offline", desc: "Show last successful sync and disable unsafe mutations." },
  { title: "API failure", desc: "Keep filters and input state, then offer a scoped retry." },
  { title: "Realtime disconnected", desc: "Continue read access and mark data freshness explicitly." },
]

export default function AdminStatesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-[#080f14]">Operational state patterns</h1>
        <button className="text-[13px] text-[#6366F1] font-semibold hover:text-[#4F46E5] transition-colors">
          Implementation reference
        </button>
      </div>

      {/* 6 Guidance cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {GUIDANCE_CARDS.map((card) => (
          <div key={card.title} className="lndry-card min-h-[80px]">
            <h3 className="text-[15px] font-bold text-[#080f14]">{card.title}</h3>
            <p className="text-[12px] text-[#7e8998] mt-1.5 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* 2 Large state demo cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Exception queue — Healthy */}
        <div className="lndry-card flex flex-col min-h-[320px]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-[#080f14]">Exception queue</h2>
              <p className="text-[12px] text-[#7e8998] mt-0.5">No matching exceptions</p>
            </div>
            <span className="inline-flex px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857] text-[10px] font-bold">Healthy</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Check className="h-10 w-10 text-[#6366F1]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[18px] font-bold text-[#080f14]">No exceptions for these filters</h3>
            <p className="text-[13px] text-[#7e8998] mt-2 max-w-[300px]">
              Clear filters or return to all open exceptions.
            </p>
          </div>

          <div className="mt-auto">
            <Button variant="outline" className="border-[#6366F1] text-[#6366F1] hover:bg-[#EEF2FF] font-bold rounded-full h-10 px-5 text-[13px]">
              Clear filters
            </Button>
          </div>
        </div>

        {/* Realtime updates paused — Disconnected */}
        <div className="lndry-card flex flex-col min-h-[320px]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-[#080f14]">Realtime updates paused</h2>
              <p className="text-[12px] text-[#7e8998] mt-0.5">Last synced 2 minutes ago</p>
            </div>
            <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold">Disconnected</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-10 w-10 text-[#F59E0B]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[18px] font-bold text-[#080f14]">Live events are temporarily unavailable</h3>
            <p className="text-[13px] text-[#7e8998] mt-2 max-w-[340px]">
              Existing data remains readable. Avoid status overrides until the connection is restored.
            </p>
          </div>

          <div className="mt-auto">
            <Button className="bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white font-bold rounded-full h-10 px-5 text-[13px] shadow-[0_4px_14px_rgba(6,182,212,0.25)]">
              Reconnect realtime updates
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
