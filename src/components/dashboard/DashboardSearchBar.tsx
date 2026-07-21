"use client"

import { Search, X } from "lucide-react"

interface DashboardSearchBarProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
}

export function DashboardSearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: DashboardSearchBarProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <span className="absolute left-3.5 text-slate-400">
        <Search className="h-4.5 w-4.5 stroke-[2]" />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-9 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="h-3.5 w-3.5 stroke-[2.5]" />
        </button>
      )}
    </div>
  )
}
