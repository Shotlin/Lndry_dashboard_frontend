"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useVendorDetails } from "@/hooks/useVendorDetail"
import { CORRECTION_SECTIONS } from "@/services/vendors.service"
import { DocumentPreviewDialog } from "@/components/shared/DocumentPreviewDialog"
import { VendorDetailsSection } from "@/components/vendors/VendorDetailsSection"

const STATUS_STYLES: Record<string, string> = {
  WAITING_FOR_APPROVAL: "bg-[#FEF3C7] text-[#B45309]",
  DRAFT: "bg-[#F1F5F9] text-[#475569]",
  CORRECTION_REQUIRED: "bg-[#FEF3C7] text-[#B45309]",
  APPROVED: "bg-[#ECFDF5] text-[#047857]",
  REJECTED: "bg-[#FEF2F2] text-[#B91C1C]",
  SUSPENDED: "bg-[#FEF2F2] text-[#B91C1C]",
}

// Separate from STATUS_STYLES (application-level statuses) since document
// review statuses are a different vocabulary — falling back to bg-muted/
// text-muted-foreground here made the badge unreadable (those two tokens
// resolve to the same gray in this theme).
const DOC_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-[#FEF3C7] text-[#B45309]",
  APPROVED: "bg-[#ECFDF5] text-[#047857]",
  REJECTED: "bg-[#FEF2F2] text-[#B91C1C]",
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ")
}

export default function ApplicationDetailPage() {
  const params = useParams()
  const appId = params.applicationId as string
  const { data: application, isLoading, isError } = useVendorDetails(appId)
  const [previewDocId, setPreviewDocId] = useState<string | null>(null)
  const previewDoc = application?.documents?.find((d) => d.id === previewDocId)

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-8">Loading application…</div>
  }

  if (isError || !application) {
    return (
      <div className="space-y-3">
        <Link href="/vendor-applications" className="text-[13px] text-[#6366F1] hover:text-[#4F46E5] font-medium">
          &larr; Back to applications
        </Link>
        <p className="text-sm text-muted-foreground">No application or vendor matches ID {appId}.</p>
      </div>
    )
  }

  const requestedRadius = application.requested_service_radius_km ?? application.delivery_radius_km
  const approvedRadius = application.approved_service_radius_km

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/vendor-applications" className="text-[13px] text-[#6366F1] hover:text-[#4F46E5] font-medium">&larr; Back to applications</Link>
          <h1 className="text-[28px] font-bold tracking-tight text-[#080f14] mt-2">{application.name}</h1>
          <p className="text-[13px] text-[#7e8998] mt-0.5">Application {application.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex px-3 py-1.5 rounded-full text-[11px] font-bold ${STATUS_STYLES[application.status] ?? "bg-muted text-muted-foreground"}`}>
            {statusLabel(application.status)}
          </span>
          {(application.status === "WAITING_FOR_APPROVAL" || application.status === "CORRECTION_REQUIRED") && (
            <>
              <Button variant="outline" className="border-[#6366F1] text-[#6366F1] hover:bg-[#EEF2FF] font-bold rounded-full h-10 px-5 text-[13px]" asChild>
                <Link href={`/vendor-applications/${appId}/decision`}>Request correction</Link>
              </Button>
              <Button className="bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white font-bold rounded-full h-10 px-5 text-[13px] shadow-[0_4px_14px_rgba(6,182,212,0.25)]" asChild>
                <Link href={`/vendor-applications/${appId}/decision`}>Approve</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {application.status === "CORRECTION_REQUIRED" && (application.rejection_reason || application.correction_sections?.length) && (
        <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4">
          <p className="text-[12px] font-bold text-[#B45309]">Correction requested</p>
          {application.correction_sections && application.correction_sections.length > 0 && (
            <p className="text-[12px] text-[#92400E] mt-1">
              Flagged sections:{" "}
              {application.correction_sections
                .map((key) => CORRECTION_SECTIONS.find((s) => s.key === key)?.label ?? key)
                .join(", ")}
            </p>
          )}
          {application.rejection_reason && (
            <p className="text-[13px] text-[#78350F] mt-1.5">{application.rejection_reason}</p>
          )}
        </div>
      )}

      {application.status === "REJECTED" && application.rejection_reason && (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4">
          <p className="text-[12px] font-bold text-[#B91C1C]">Rejection note</p>
          <p className="text-[13px] text-[#7F1D1D] mt-1.5">{application.rejection_reason}</p>
        </div>
      )}

      <VendorDetailsSection id={appId} vendor={application} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-4">
          {/* Location and radius */}
          <div className="lndry-card">
            <h2 className="text-[15px] font-bold text-[#080f14] mb-1">Location and radius</h2>
            <p className="text-[12px] text-[#7e8998] mb-4">Pin and requested service area</p>
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between"><span className="text-[#7e8998]">Address</span><span className="text-[#080f14] font-medium">{[application.address_line1, application.city, application.pincode].filter(Boolean).join(", ") || "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-[#7e8998]">Requested radius</span><span className="text-[#080f14] font-bold">{requestedRadius != null ? `${requestedRadius} km` : "N/A"}</span></div>
              {approvedRadius != null && (
                <div className="flex justify-between">
                  <span className="text-[#7e8998]">Approved radius</span>
                  <span className="text-[#047857] font-semibold">{approvedRadius} km</span>
                </div>
              )}
              {(application.status === "WAITING_FOR_APPROVAL" || application.status === "CORRECTION_REQUIRED" || application.status === "APPROVED") && (
                <Link href={`/vendor-applications/${appId}/radius`} className="text-[13px] text-[#6366F1] font-semibold hover:text-[#4F46E5] inline-block mt-1">
                  Open radius &amp; capacity review
                </Link>
              )}
            </div>
          </div>

          {/* Capacity request */}
          <div className="lndry-card">
            <h2 className="text-[15px] font-bold text-[#080f14] mb-1">Capacity request</h2>
            <p className="text-[12px] text-[#7e8998] mb-4">Requested daily order capacity</p>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#7e8998]">Requested capacity</span>
              <span className="text-[#080f14] font-bold">
                {application.requested_daily_capacity != null ? `${application.requested_daily_capacity} orders/day` : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Right column: Documents */}
        <div className="lndry-card">
          <h2 className="text-[15px] font-bold text-[#080f14] mb-1">Onboarding documents</h2>
          <p className="text-[12px] text-[#7e8998] mb-4">{application.documents?.length ?? 0} file(s) uploaded</p>
          {(!application.documents || application.documents.length === 0) ? (
            <p className="text-[13px] text-[#7e8998] py-8 text-center">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {application.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border border-[#e8e8ef] bg-[#fafafd]">
                  <span className="text-[13px] font-medium text-[#080f14] capitalize">{doc.document_type.replace(/_/g, " ")}</span>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${DOC_STATUS_STYLES[doc.status] ?? "bg-[#F1F5F9] text-[#475569]"}`}>
                      {doc.status}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewDocId(doc.id)}
                      className="h-7 px-3 text-[11px] font-semibold border-[#6366F1] text-[#6366F1] hover:bg-[#EEF2FF] rounded-full"
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DocumentPreviewDialog
        documentId={previewDocId}
        title={previewDoc?.document_type.replace(/_/g, " ")}
        onOpenChange={(open) => !open && setPreviewDocId(null)}
      />
    </div>
  )
}
