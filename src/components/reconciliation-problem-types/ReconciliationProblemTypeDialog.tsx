"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  useCreateReconciliationProblemType,
  useUpdateReconciliationProblemType,
} from "@/hooks/useReconciliationProblemTypes"
import type {
  ReconciliationProblemType,
  CreateReconciliationProblemTypePayload,
} from "@/types/reconciliation-problem-type.types"

interface ReconciliationProblemTypeDialogProps {
  open: boolean
  onClose: () => void
  problemType?: ReconciliationProblemType | null
}

const INITIAL: CreateReconciliationProblemTypePayload & { isActive: boolean } = {
  label: "",
  description: "",
  sortOrder: 0,
  isActive: true,
}

export function ReconciliationProblemTypeDialog({
  open,
  onClose,
  problemType,
}: ReconciliationProblemTypeDialogProps) {
  const [form, setForm] = useState(INITIAL)
  const isEdit = !!problemType
  const createMutation = useCreateReconciliationProblemType()
  const updateMutation = useUpdateReconciliationProblemType()

  useEffect(() => {
    if (problemType) {
      setForm({
        label: problemType.label,
        description: problemType.description ?? "",
        sortOrder: problemType.sortOrder,
        isActive: problemType.isActive,
      })
    } else {
      setForm(INITIAL)
    }
  }, [problemType, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const { isActive, ...rest } = form
    const payload = {
      ...rest,
      description: rest.description || undefined,
    }
    if (isEdit && problemType) {
      updateMutation.mutate({ id: problemType.id, payload: { ...payload, isActive } }, { onSuccess: onClose })
    } else {
      createMutation.mutate(payload, { onSuccess: onClose })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Problem Type" : "New Problem Type"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rpt-label">Label *</Label>
            <Input
              id="rpt-label"
              placeholder="e.g. Damaged Item"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              required
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              This is exactly what every vendor sees as a selectable option when reporting a problem
              during order re-evaluation.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rpt-description">Description</Label>
            <Input
              id="rpt-description"
              placeholder="Short hint shown to the vendor (optional)"
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={255}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rpt-sort">Display Order</Label>
            <Input
              id="rpt-sort"
              type="number"
              value={form.sortOrder ?? 0}
              onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground">
              Lower numbers appear first in the vendor app&apos;s picker.
            </p>
          </div>

          {isEdit && (
            <div className="flex items-center gap-3">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label>Active</Label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
