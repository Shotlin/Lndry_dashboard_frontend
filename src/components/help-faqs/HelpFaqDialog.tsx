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
import { Textarea } from "@/components/ui/textarea"
import { useCreateHelpFaq, useUpdateHelpFaq } from "@/hooks/useHelpFaqs"
import type { HelpFaq } from "@/types"

interface HelpFaqDialogProps {
  open: boolean
  onClose: () => void
  faq?: HelpFaq | null
  /** Suggested display order for a brand-new FAQ (puts it last). */
  nextSortOrder: number
}

export function HelpFaqDialog({ open, onClose, faq, nextSortOrder }: HelpFaqDialogProps) {
  const isEdit = !!faq
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [sortOrder, setSortOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)

  const createMutation = useCreateHelpFaq()
  const updateMutation = useUpdateHelpFaq()
  const isPending = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (!open) return
    setQuestion(faq?.question ?? "")
    setAnswer(faq?.answer ?? "")
    setSortOrder(faq?.sortOrder ?? nextSortOrder)
    setIsActive(faq?.isActive ?? true)
  }, [open, faq, nextSortOrder])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { question: question.trim(), answer: answer.trim(), sortOrder, isActive }
    if (isEdit && faq) {
      updateMutation.mutate({ id: faq.id, payload }, { onSuccess: onClose })
    } else {
      createMutation.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="faq-question">Question *</Label>
            <Input
              id="faq-question"
              placeholder="e.g. What is the turnaround time for delivery?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              minLength={3}
              maxLength={500}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="faq-answer">Answer *</Label>
            <Textarea
              id="faq-answer"
              rows={6}
              placeholder="The answer customers see when they tap the question"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              maxLength={4000}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="faq-sort">Display order</Label>
            <Input
              id="faq-sort"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">Lower numbers appear first in the app.</p>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Show in the app</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !question.trim() || !answer.trim()}>
              {isPending ? "Saving..." : isEdit ? "Save changes" : "Add FAQ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
