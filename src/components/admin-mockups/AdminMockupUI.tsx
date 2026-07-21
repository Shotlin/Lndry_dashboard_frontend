"use client"

import type { ReactNode } from "react"
import { Download, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export function MockupPage({
  title,
  searchPlaceholder,
  actionLabel,
  action,
  children,
}: {
  title: string
  searchPlaceholder?: string
  actionLabel?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="space-y-[26px]">
      <div className="flex min-h-[44px] items-start justify-between gap-6">
        <h1 className="text-[30px] font-extrabold leading-none tracking-[-0.045em] text-[#080d14]">
          {title}
        </h1>
        {(searchPlaceholder || actionLabel || action) && (
          <div className="flex items-center gap-3">
            {searchPlaceholder && (
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8da3]" />
                <input
                  aria-label={searchPlaceholder}
                  placeholder={searchPlaceholder}
                  className="h-[43px] w-[280px] rounded-full border border-[#dfe3ee] bg-white pl-11 pr-4 text-[13px] text-[#0d1520] shadow-[0_10px_28px_rgba(99,102,241,0.08)] outline-none transition focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/10"
                />
              </div>
            )}
            {action ??
              (actionLabel ? (
                <button className="inline-flex h-[43px] items-center gap-2 rounded-[14px] border border-[#6366F1] bg-white px-5 text-[13px] font-extrabold text-[#6366F1] transition hover:bg-[#EEF2FF]">
                  <Download className="h-4 w-4" />
                  {actionLabel}
                </button>
              ) : null)}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

export function MockupCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "rounded-[16px] border border-[#e3e6ef] bg-white shadow-[0_4px_0_rgba(20,27,49,0.035)]",
        className,
      )}
    >
      {children}
    </section>
  )
}

export function StatCard({
  label,
  value,
  delta,
  tone = "positive",
}: {
  label: string
  value: ReactNode
  delta: string
  tone?: "positive" | "warning" | "danger" | "neutral"
}) {
  const toneClass = {
    positive: "text-[#047857]",
    warning: "text-[#B45309]",
    danger: "text-[#B91C1C]",
    neutral: "text-[#6366F1]",
  }[tone]

  return (
    <MockupCard className="flex h-[118px] flex-col justify-between p-[18px]">
      <p className="text-[12px] font-medium leading-none text-[#7c899c]">{label}</p>
      <p className="text-[29px] font-extrabold leading-none tracking-[-0.04em] text-[#070c13]">
        {value}
      </p>
      <p className={cn("text-[11px] font-bold leading-none", toneClass)}>{delta}</p>
    </MockupCard>
  )
}

export function SectionHeader({
  title,
  subtitle,
  pill,
  link,
}: {
  title: string
  subtitle?: string
  pill?: string
  link?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-extrabold leading-none tracking-[-0.02em] text-[#101722]">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-[12px] font-medium leading-none text-[#7c899c]">{subtitle}</p>}
      </div>
      {pill && (
        <span className="rounded-full bg-[#EEF2FF] px-3 py-2 text-[11px] font-extrabold leading-none text-[#6366F1]">
          {pill}
        </span>
      )}
      {link}
    </div>
  )
}

export function MockupTabs({
  tabs,
  active = 0,
}: {
  tabs: Array<{ label: string; count?: string | number }>
  active?: number
}) {
  return (
    <div className="flex flex-wrap items-center gap-9 px-4 text-[12px] font-extrabold">
      {tabs.map((tab, index) => (
        <button
          key={tab.label}
          className={cn(
            "text-[#7c899c] transition hover:text-[#6366F1]",
            index === active && "text-[#6366F1]",
          )}
        >
          {tab.label}
          {tab.count !== undefined && <span className="ml-1">{tab.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: "success" | "warning" | "danger" | "purple" | "neutral"
}) {
  const toneClass = {
    success: "bg-[#d9f6f2] text-[#047857]",
    warning: "bg-[#fff2d7] text-[#a06a00]",
    danger: "bg-[#ffedf1] text-[#B91C1C]",
    purple: "bg-[#EEF2FF] text-[#6366F1]",
    neutral: "bg-[#eef2f8] text-[#64748b]",
  }[tone]

  return (
    <span className={cn("inline-flex rounded-full px-[11px] py-[7px] text-[11px] font-extrabold leading-none", toneClass)}>
      {children}
    </span>
  )
}

export function MockupTable({
  columns,
  rows,
  className,
}: {
  columns: string[]
  rows: ReactNode[][]
  className?: string
}) {
  return (
    <MockupCard className={cn("overflow-hidden p-[28px]", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} className="pb-[22px] text-[12px] font-extrabold text-[#7c899c]">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="py-[16px] align-middle text-[#080d14]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MockupCard>
  )
}

export function BarChartMockup({
  values = [51, 68, 62, 76, 71, 92, 83],
  labels = ["", "", "", "", "", "", ""],
}: {
  values?: number[]
  labels?: string[]
}) {
  return (
    <div className="flex h-[190px] items-end gap-[14px] pt-8">
      {values.map((value, index) => {
        const highlighted = index === 2 || index === 5
        return (
          <div key={`${index}-${value}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div
              style={{ height: `${value}%` }}
              className={cn(
                "w-full min-w-[34px] rounded-[6px] transition",
                highlighted ? "bg-[#6366F1]" : "bg-[#C7D2FE]",
              )}
            />
            {labels[index] && <span className="text-[10px] font-bold text-[#7c899c]">{labels[index]}</span>}
          </div>
        )
      })}
    </div>
  )
}

export function MetricStrip({
  items,
}: {
  items: Array<{ title: string; value: ReactNode; note: string }>
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {items.map((item) => (
        <MockupCard key={item.title} className="p-[18px]">
          <p className="text-[15px] font-extrabold leading-none text-[#111827]">{item.title}</p>
          <p className="mt-4 text-[30px] font-extrabold leading-none tracking-[-0.04em] text-[#070c13]">
            {item.value}
          </p>
          <p className="mt-2 text-[12px] font-medium text-[#7c899c]">{item.note}</p>
        </MockupCard>
      ))}
    </div>
  )
}
