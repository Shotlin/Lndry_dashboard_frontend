"use client"

import { useMemo } from "react"
import { CheckCircle2, CircleAlert, CircleX } from "lucide-react"
import { analyzeSeo, SEO_DESCRIPTION_RANGE, SEO_TITLE_RANGE, type SeoInput } from "@/lib/blog-seo"

const statusIcon = {
  good: <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" aria-label="Passed" />,
  warn: <CircleAlert size={16} className="mt-0.5 shrink-0 text-amber-500" aria-label="Could be better" />,
  bad: <CircleX size={16} className="mt-0.5 shrink-0 text-destructive" aria-label="Needs work" />,
} as const

const gradeStyle = {
  good: { ring: "#059669", label: "Good — ready to rank" },
  ok: { ring: "#f59e0b", label: "Okay — a few fixes will help" },
  poor: { ring: "#dc2626", label: "Needs work before publishing" },
} as const

export function SeoPanel({ input, slug }: { input: SeoInput; slug: string }) {
  const report = useMemo(() => analyzeSeo(input), [input])
  const grade = gradeStyle[report.grade]
  const rank = { bad: 0, warn: 1, good: 2 } as const
  const ordered = [...report.checks].sort((a, b) => rank[a.status] - rank[b.status])

  const title = (input.metaTitle || input.title || "Your article title").trim()
  const description = (input.metaDescription || input.excerpt || "Your meta description will appear here…").trim()
  const [tMin, tMax] = SEO_TITLE_RANGE
  const [dMin, dMax] = SEO_DESCRIPTION_RANGE

  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-4">
        <div
          className="grid h-16 w-16 shrink-0 place-items-center rounded-full text-xl font-bold"
          style={{ background: `conic-gradient(${grade.ring} ${report.score * 3.6}deg, hsl(var(--border)) 0)` }}
          role="img"
          aria-label={`SEO score ${report.score} out of 100`}
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-card">{report.score}</span>
        </div>
        <div>
          <p className="text-base font-semibold">SEO score</p>
          <p className="text-sm text-muted-foreground">{grade.label}</p>
          <p className="text-xs text-muted-foreground">{report.wordCount} words</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Google preview</p>
        <div className="mt-2 rounded-md border bg-white p-4 text-neutral-800">
          <p className="truncate text-xs text-neutral-500">lndry.in › blog › {slug || "your-url"}</p>
          <p className="mt-1 line-clamp-2 text-lg leading-snug text-[#1a0dab]">{title.length > 62 ? `${title.slice(0, 60)}…` : title}</p>
          <p className="mt-1 line-clamp-2 text-sm leading-snug text-neutral-600">{description.length > 160 ? `${description.slice(0, 158)}…` : description}</p>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Title {title.length}/{tMax} (best {tMin}–{tMax}) · Description {description.length}/{dMax} (best {dMin}–{dMax})
        </p>
      </div>

      <ul className="grid gap-2.5">
        {ordered.map((check) => (
          <li key={check.id} className="flex gap-2.5">
            {statusIcon[check.status]}
            <div className="min-w-0">
              <p className="text-sm font-semibold">{check.label}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{check.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
