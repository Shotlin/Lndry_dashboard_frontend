"use client"

import { Suspense, useState } from "react"
import { Plus, MoreHorizontal, Pencil, Trash2, UserPlus } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ReferralProgramDialog } from "@/components/referral-programs/ReferralProgramDialog"
import { useReferralPrograms, useDeleteReferralProgram } from "@/hooks/useReferralPrograms"
import { usePermissions } from "@/hooks/usePermissions"
import { formatINR } from "@/lib/utils"
import type { ReferralProgram, ReferralRewardType } from "@/types/referral-program.types"

function rewardSummary(type: ReferralRewardType, amount: number | null, count: number | null) {
  switch (type) {
    case "WALLET_CREDIT":
      return `${formatINR(amount ?? 0)} wallet`
    case "FREE_EXPRESS_DELIVERY":
      return `${count ?? 1}x free express delivery`
    case "FREE_STANDARD_DELIVERY":
      return `${count ?? 1}x free standard delivery`
    case "COUPON_UNLOCK":
      return "Unlocks a coupon"
    default:
      return type
  }
}

const TARGET_LABELS: Record<string, string> = {
  ALL: "All customers",
  SEGMENT: "Segment",
}

function ReferralProgramsContent() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<ReferralProgram | null>(null)

  const { data: programs, isLoading } = useReferralPrograms()
  const deleteMutation = useDeleteReferralProgram()
  const { can } = usePermissions()
  const canManage = can("settings.write")

  const openCreate = () => {
    setEditingProgram(null)
    setDialogOpen(true)
  }

  const openEdit = (program: ReferralProgram) => {
    setEditingProgram(program)
    setDialogOpen(true)
  }

  const handleDelete = (program: ReferralProgram) => {
    if (confirm(`Delete "${program.name}"?`)) deleteMutation.mutate(program.id)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referral Programs"
        subtitle="Refer & Earn campaigns — multiple can be active at once, targeted by customer segment"
      >
        {canManage && (
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> New Program
          </Button>
        )}
      </PageHeader>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Referrer Gets</TableHead>
              <TableHead>Referee Gets</TableHead>
              <TableHead className="hidden md:table-cell">Target</TableHead>
              <TableHead className="hidden md:table-cell">Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !programs || programs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    icon={<UserPlus className="h-6 w-6 text-muted-foreground" />}
                    title="No referral programs yet"
                    description="Create one, e.g. &quot;Refer a friend — you both get ₹50&quot;"
                  />
                </TableCell>
              </TableRow>
            ) : (
              [...programs]
                .sort((a, b) => b.priority - a.priority)
                .map((program) => (
                  <TableRow key={program.id}>
                    <TableCell className="font-medium">{program.name}</TableCell>
                    <TableCell className="text-sm">
                      {rewardSummary(program.referrerRewardType, program.referrerRewardAmount, program.referrerRewardCount)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {rewardSummary(program.refereeRewardType, program.refereeRewardAmount, program.refereeRewardCount)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {TARGET_LABELS[program.targetType] ?? program.targetType}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{program.priority}</TableCell>
                    <TableCell>
                      <Badge variant={program.isActive ? "default" : "outline"}>
                        {program.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {canManage ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(program)}>
                              <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(program)}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      <ReferralProgramDialog open={dialogOpen} onClose={() => setDialogOpen(false)} program={editingProgram} />
    </div>
  )
}

export default function ReferralProgramsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="table" />}>
      <ReferralProgramsContent />
    </Suspense>
  )
}
