"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useReviewVendorApplication } from "@/hooks/useVendorApplications"
import { CORRECTION_SECTIONS, type CorrectionSectionKey } from "@/services/vendors.service"

export default function DecisionCenterPage() {
  const params = useParams()
  const router = useRouter()
  const appId = params.applicationId as string
  const reviewApplication = useReviewVendorApplication()

  const [showCorrectionForm, setShowCorrectionForm] = useState(false)
  const [selectedSections, setSelectedSections] = useState<CorrectionSectionKey[]>([])
  const [correctionNote, setCorrectionNote] = useState("")

  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectNote, setRejectNote] = useState("")

  function handleApprove() {
    // The actual APPROVED review call happens on the radius page, which
    // also needs the approved radius value in the same request.
    router.push(`/vendor-applications/${appId}/radius`)
  }

  function toggleSection(key: CorrectionSectionKey) {
    setSelectedSections((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    )
  }

  function submitCorrection() {
    reviewApplication.mutate(
      {
        id: appId,
        payload: {
          status: "CORRECTION_REQUIRED",
          correctionSections: selectedSections,
          rejectionReason: correctionNote.trim(),
        },
      },
      { onSuccess: () => router.push("/vendor-applications") }
    )
  }

  function confirmReject() {
    reviewApplication.mutate(
      {
        id: appId,
        payload: {
          status: "REJECTED",
          rejectionReason: rejectNote.trim() || undefined,
        },
      },
      { onSuccess: () => router.push("/vendor-applications") }
    )
  }

  const isPending = reviewApplication.isPending
  const canSubmitCorrection = selectedSections.length > 0 && correctionNote.trim().length > 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-[#080f14]">Vendor decision</h1>
        <span className="inline-flex px-3 py-1.5 rounded-full bg-[#EEF2FF] text-[#6366F1] text-[12px] font-bold border border-[#6366F1]/10">
          {appId}
        </span>
      </div>

      {/* 3 Decision cards in a row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Approve */}
        <div className="lndry-card flex flex-col justify-between min-h-[200px]">
          <div>
            <span className="inline-flex px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] text-[10px] font-bold">
              Approve
            </span>
            <h3 className="text-[15px] font-bold text-[#080f14] mt-3">Activate verified setup</h3>
            <p className="text-[12px] text-[#7e8998] mt-2 leading-relaxed">
              Unlock business profile, employees, services, capacity, and order access with the approved radius.
            </p>
          </div>
          <Button
            onClick={handleApprove}
            disabled={isPending}
            className="bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-full h-10 text-[12px] mt-4"
          >
            Approve vendor
          </Button>
        </div>

        {/* Correction */}
        <div className="lndry-card flex flex-col justify-between min-h-[200px]">
          <div>
            <span className="inline-flex px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold">
              Correction
            </span>
            <h3 className="text-[15px] font-bold text-[#080f14] mt-3">Request specific changes</h3>
            <p className="text-[12px] text-[#7e8998] mt-2 leading-relaxed">
              Pick exactly what's wrong and explain it — the vendor will only be able to edit those parts.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowCorrectionForm((v) => !v)}
            disabled={isPending}
            className="border-[#6366F1] text-[#6366F1] hover:bg-[#EEF2FF] font-bold rounded-full h-10 text-[12px] mt-4"
          >
            {showCorrectionForm ? "Hide correction form" : "Request correction"}
          </Button>
        </div>

        {/* Reject */}
        <div className="lndry-card flex flex-col justify-between min-h-[200px]">
          <div>
            <span className="inline-flex px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#B91C1C] text-[10px] font-bold">
              Reject
            </span>
            <h3 className="text-[15px] font-bold text-[#080f14] mt-3">Reject this application</h3>
            <p className="text-[12px] text-[#7e8998] mt-2 leading-relaxed">
              The vendor will be notified that their application was rejected.
            </p>
          </div>
          <Button
            onClick={() => setShowRejectDialog(true)}
            disabled={isPending}
            className="bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold rounded-full h-10 text-[12px] mt-4"
          >
            Reject application
          </Button>
        </div>
      </div>

      {/* Correction detail form — only what's checked here stays editable for the vendor */}
      {showCorrectionForm && (
        <div className="lndry-card">
          <h2 className="text-[15px] font-bold text-[#080f14] mb-1">What needs to be corrected?</h2>
          <p className="text-[12px] text-[#7e8998] mb-4">
            Select every section that has a problem. Everything else will stay locked (read-only) for the vendor
            so they can't accidentally change details you already verified.
          </p>
          <div className="space-y-2.5 mb-5">
            {CORRECTION_SECTIONS.map((section) => (
              <label
                key={section.key}
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#e8e8ef] hover:bg-[#fafafd] cursor-pointer"
              >
                <Checkbox
                  checked={selectedSections.includes(section.key)}
                  onCheckedChange={() => toggleSection(section.key)}
                />
                <span className="text-[13px] font-medium text-[#080f14]">{section.label}</span>
              </label>
            ))}
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-[#7e8998]">
              Explain what's wrong (shown to the vendor)
            </label>
            <Textarea
              value={correctionNote}
              onChange={(e) => setCorrectionNote(e.target.value)}
              placeholder="e.g. Your PAN number doesn't match the uploaded owner identity document — please re-check and re-enter it."
              className="min-h-[90px] text-[13px]"
            />
          </div>
          <div className="flex justify-end mt-4">
            <Button
              onClick={submitCorrection}
              disabled={!canSubmitCorrection || isPending}
              className="bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold rounded-full h-10 px-6 text-[13px]"
            >
              {isPending ? "Submitting…" : "Submit correction request"}
            </Button>
          </div>
          {!canSubmitCorrection && (
            <p className="text-[11px] text-[#7e8998] mt-2 text-right">
              Select at least one section and add an explanation before submitting.
            </p>
          )}
        </div>
      )}

      {/* Reject confirmation */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this application?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone from here — the vendor will need to submit a brand-new application to try again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5 py-2">
            <label className="text-[12px] font-semibold text-[#7e8998]">Note (optional)</label>
            <Textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Leave blank to just notify the vendor their application was rejected."
              className="min-h-[80px] text-[13px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              disabled={isPending}
              className="bg-[#EF4444] hover:bg-[#DC2626]"
            >
              {isPending ? "Rejecting…" : "Yes, reject application"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
