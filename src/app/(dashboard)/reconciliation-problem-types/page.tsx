"use client"

import { Suspense, useState } from "react"
import { Plus, MoreHorizontal, Pencil, Trash2, AlertTriangle } from "lucide-react"
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
import { ReconciliationProblemTypeDialog } from "@/components/reconciliation-problem-types/ReconciliationProblemTypeDialog"
import {
  useReconciliationProblemTypes,
  useDeleteReconciliationProblemType,
} from "@/hooks/useReconciliationProblemTypes"
import { usePermissions } from "@/hooks/usePermissions"
import type { ReconciliationProblemType } from "@/types/reconciliation-problem-type.types"

function ReconciliationProblemTypesContent() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<ReconciliationProblemType | null>(null)

  const { data: problemTypes, isLoading } = useReconciliationProblemTypes()
  const deleteMutation = useDeleteReconciliationProblemType()
  const { can } = usePermissions()
  const canManage = can("settings.write")

  const openCreate = () => {
    setEditingType(null)
    setDialogOpen(true)
  }

  const openEdit = (problemType: ReconciliationProblemType) => {
    setEditingType(problemType)
    setDialogOpen(true)
  }

  const handleDelete = (problemType: ReconciliationProblemType) => {
    if (confirm(`Delete "${problemType.label}"? Vendors will no longer see it as an option.`)) {
      deleteMutation.mutate(problemType.id)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reconciliation Problem Types"
        subtitle="The universal list every vendor picks from when reporting a problem with an item during order re-evaluation (e.g. damaged, or not applicable to the selected service)"
      >
        {canManage && (
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> New Problem Type
          </Button>
        )}
      </PageHeader>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !problemTypes || problemTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    icon={<AlertTriangle className="h-6 w-6 text-muted-foreground" />}
                    title="No problem types yet"
                    description='Create one like "Damaged Item" so vendors have something to select'
                  />
                </TableCell>
              </TableRow>
            ) : (
              [...problemTypes]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((problemType) => (
                  <TableRow key={problemType.id}>
                    <TableCell className="font-medium">{problemType.label}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {problemType.description || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{problemType.sortOrder}</TableCell>
                    <TableCell>
                      <Badge variant={problemType.isActive ? "default" : "outline"}>
                        {problemType.isActive ? "Active" : "Inactive"}
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
                            <DropdownMenuItem onClick={() => openEdit(problemType)}>
                              <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(problemType)}
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

      <ReconciliationProblemTypeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        problemType={editingType}
      />
    </div>
  )
}

export default function ReconciliationProblemTypesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="table" />}>
      <ReconciliationProblemTypesContent />
    </Suspense>
  )
}
