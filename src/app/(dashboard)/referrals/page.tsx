"use client"

import { Suspense, useState } from "react"
import { Search, Users2 } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useReferrals, useReferralsSummary } from "@/hooks/useReferrals"
import { useDebounce } from "@/hooks/useDebounce"
import { formatDateTime } from "@/lib/utils"
import type { ReferralRewardStatus } from "@/types/referral.types"

const REWARD_STATUS_VARIANT: Record<ReferralRewardStatus, "default" | "secondary" | "outline" | "destructive"> = {
  GRANTED: "default",
  PENDING: "secondary",
  FAILED: "destructive",
  NOT_APPLICABLE: "outline",
}

function RewardStatusBadge({ status }: { status: ReferralRewardStatus }) {
  return (
    <Badge variant={REWARD_STATUS_VARIANT[status]} className="text-[10px]">
      {status.replace(/_/g, " ")}
    </Badge>
  )
}

function ReferralsContent() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)

  const { data: summary } = useReferralsSummary()
  const { data, isLoading } = useReferrals({ search: debouncedSearch || undefined, limit: 20 })
  const referrals = data?.referrals ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referrals"
        subtitle="Every referral relationship platform-wide — rewards grant automatically, this is read-only"
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Referrals</p>
          <p className="text-2xl font-semibold">{summary?.total ?? "—"}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Awaiting First Order</p>
          <p className="text-2xl font-semibold">{summary?.pending ?? "—"}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="text-2xl font-semibold">{summary?.completed ?? "—"}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Rewards Granted</p>
          <p className="text-2xl font-semibold">{summary?.rewardsGranted ?? "—"}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by referrer or referee name/phone..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referrer</TableHead>
              <TableHead>Referee</TableHead>
              <TableHead className="hidden md:table-cell">Program</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Referrer Reward</TableHead>
              <TableHead className="hidden md:table-cell">Referee Reward</TableHead>
              <TableHead className="hidden md:table-cell">Signed Up</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : referrals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    icon={<Users2 className="h-6 w-6 text-muted-foreground" />}
                    title="No referrals yet"
                    description="Once a customer redeems someone's referral code, it'll show up here."
                  />
                </TableCell>
              </TableRow>
            ) : (
              referrals.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell>
                    <p className="font-medium">{referral.referrerName ?? "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{referral.referrerPhone}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{referral.refereeName ?? "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{referral.refereePhone}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {referral.programName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={referral.status === "COMPLETED" ? "default" : "secondary"}>
                      {referral.status === "COMPLETED" ? "Completed" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <RewardStatusBadge status={referral.referrerRewardStatus} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <RewardStatusBadge status={referral.refereeRewardStatus} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {formatDateTime(referral.refereeSignedUpAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default function ReferralsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="table" />}>
      <ReferralsContent />
    </Suspense>
  )
}
