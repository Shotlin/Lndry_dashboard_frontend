"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useVendorDetails, useViewKycDocument } from "@/hooks/useVendorDetail"
import { useUpdateVendorApplicationDetails } from "@/hooks/useVendorApplications"
import { CORRECTION_SECTIONS } from "@/services/vendors.service"

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
  const viewDocument = useViewKycDocument()
  const updateDetails = useUpdateVendorApplicationDetails()

  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [editForm, setEditForm] = useState({
    ownerName: "",
    name: "",
    description: "",
    email: "",
    gstNumber: "",
    panNumber: "",
  })

  function startEditing() {
    if (!application) return
    setEditForm({
      ownerName: application.owner_name ?? "",
      name: application.name ?? "",
      description: application.description ?? "",
      email: application.email ?? "",
      gstNumber: application.gst_number ?? "",
      panNumber: application.pan_number ?? "",
    })
    setIsEditingDetails(true)
  }

  function saveEditing() {
    updateDetails.mutate(
      {
        id: appId,
        payload: {
          owner_name: editForm.ownerName,
          name: editForm.name,
          description: editForm.description,
          email: editForm.email,
          gst_number: editForm.gstNumber,
          pan_number: editForm.panNumber,
        },
      },
      { onSuccess: () => setIsEditingDetails(false) }
    )
  }

  const [isEditingBank, setIsEditingBank] = useState(false)
  const [bankForm, setBankForm] = useState({
    accountHolder: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
  })

  function startEditingBank() {
    if (!application) return
    setBankForm({
      accountHolder: application.bank_holder_name ?? "",
      accountNumber: application.bank_account_number ?? "",
      ifsc: application.bank_ifsc ?? "",
      bankName: application.bank_name ?? "",
    })
    setIsEditingBank(true)
  }

  function saveBankEditing() {
    updateDetails.mutate(
      {
        id: appId,
        payload: {
          bank_holder_name: bankForm.accountHolder,
          bank_account_number: bankForm.accountNumber,
          bank_ifsc: bankForm.ifsc,
          bank_name: bankForm.bankName,
        },
      },
      { onSuccess: () => setIsEditingBank(false) }
    )
  }

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-4">
          {/* Owner and business */}
          <div className="lndry-card">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2 className="text-[15px] font-bold text-[#080f14]">Owner and business</h2>
                <p className="text-[12px] text-[#7e8998]">Identity and operating details</p>
              </div>
              {!isEditingDetails ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEditing}
                  className="h-7 px-3 text-[11px] font-semibold border-[#6366F1] text-[#6366F1] hover:bg-[#EEF2FF] rounded-full"
                >
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingDetails(false)}
                    disabled={updateDetails.isPending}
                    className="h-7 px-3 text-[11px] font-semibold rounded-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveEditing}
                    disabled={updateDetails.isPending}
                    className="h-7 px-3 text-[11px] font-semibold rounded-full bg-[#6366F1] hover:bg-[#4F46E5] text-white"
                  >
                    {updateDetails.isPending ? "Saving…" : "Save"}
                  </Button>
                </div>
              )}
            </div>

            {!isEditingDetails ? (
              <div className="space-y-3 text-[13px] mt-3">
                <div className="flex justify-between"><span className="text-[#7e8998]">Owner</span><span className="text-[#080f14] font-medium">{application.owner_name || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-[#7e8998]">Business</span><span className="text-[#080f14] font-medium">{application.name || "N/A"}</span></div>
                <div className="pt-1 pb-1 border-t border-[#f4f4f8]">
                  <span className="text-[#7e8998] block mb-1">Description</span>
                  <p className="text-[#080f14] font-medium leading-relaxed">{application.description || "N/A"}</p>
                </div>
                <div className="flex justify-between border-t border-[#f4f4f8] pt-3"><span className="text-[#7e8998]">Email</span><span className="text-[#080f14] font-medium">{application.email || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-[#7e8998]">GST / PAN</span><span className="text-[#080f14] font-medium">{application.gst_number || "N/A"} / {application.pan_number || "N/A"}</span></div>
                <div className="flex justify-between">
                  <span className="text-[#7e8998]">Mobile</span>
                  <span className="text-[#080f14] font-medium">{application.phone ? `+91 ${application.phone}` : "N/A"}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 mt-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-owner-name" className="text-[12px] text-[#7e8998]">Owner</Label>
                  <Input
                    id="edit-owner-name"
                    value={editForm.ownerName}
                    onChange={(e) => setEditForm((f) => ({ ...f, ownerName: e.target.value }))}
                    placeholder="Owner's full name"
                    className="h-9 text-[13px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-business-name" className="text-[12px] text-[#7e8998]">Business</Label>
                  <Input
                    id="edit-business-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Business name"
                    className="h-9 text-[13px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-description" className="text-[12px] text-[#7e8998]">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="What the vendor's shop specializes in"
                    className="min-h-[70px] text-[13px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-email" className="text-[12px] text-[#7e8998]">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="owner@example.com"
                    className="h-9 text-[13px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="edit-gst" className="text-[12px] text-[#7e8998]">GST Number</Label>
                    <Input
                      id="edit-gst"
                      value={editForm.gstNumber}
                      onChange={(e) => setEditForm((f) => ({ ...f, gstNumber: e.target.value }))}
                      className="h-9 text-[13px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-pan" className="text-[12px] text-[#7e8998]">PAN Number</Label>
                    <Input
                      id="edit-pan"
                      value={editForm.panNumber}
                      onChange={(e) => setEditForm((f) => ({ ...f, panNumber: e.target.value }))}
                      className="h-9 text-[13px]"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-[13px] pt-1">
                  <span className="text-[#7e8998]">Mobile</span>
                  <span className="text-[#080f14] font-medium">{application.phone ? `+91 ${application.phone}` : "N/A"}</span>
                </div>
                <p className="text-[11px] text-[#7e8998]">Mobile number is tied to the vendor's login and can't be changed here.</p>
              </div>
            )}
          </div>

          {/* Bank details — this is what payouts get sent to, so it's kept as its
              own edit toggle separate from identity fields: correcting a mistyped
              IFSC shouldn't require touching business info, and vice versa. */}
          <div className="lndry-card">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2 className="text-[15px] font-bold text-[#080f14]">Bank Details</h2>
                <p className="text-[12px] text-[#7e8998]">For payout verification</p>
              </div>
              {!isEditingBank ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEditingBank}
                  className="h-7 px-3 text-[11px] font-semibold border-[#6366F1] text-[#6366F1] hover:bg-[#EEF2FF] rounded-full"
                >
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingBank(false)}
                    disabled={updateDetails.isPending}
                    className="h-7 px-3 text-[11px] font-semibold rounded-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveBankEditing}
                    disabled={updateDetails.isPending}
                    className="h-7 px-3 text-[11px] font-semibold rounded-full bg-[#6366F1] hover:bg-[#4F46E5] text-white"
                  >
                    {updateDetails.isPending ? "Saving…" : "Save"}
                  </Button>
                </div>
              )}
            </div>

            {!isEditingBank ? (
              <div className="space-y-3 text-[13px] mt-3">
                <div className="flex justify-between"><span className="text-[#7e8998]">Account Holder</span><span className="text-[#080f14] font-medium">{application.bank_holder_name || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-[#7e8998]">Account Number</span><span className="text-[#080f14] font-medium">{application.bank_account_number || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-[#7e8998]">IFSC Code</span><span className="text-[#080f14] font-medium">{application.bank_ifsc || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-[#7e8998]">Bank Name</span><span className="text-[#080f14] font-medium">{application.bank_name || "N/A"}</span></div>
              </div>
            ) : (
              <div className="space-y-3 mt-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-bank-holder" className="text-[12px] text-[#7e8998]">Account Holder</Label>
                  <Input
                    id="edit-bank-holder"
                    value={bankForm.accountHolder}
                    onChange={(e) => setBankForm((f) => ({ ...f, accountHolder: e.target.value }))}
                    className="h-9 text-[13px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-bank-account" className="text-[12px] text-[#7e8998]">Account Number</Label>
                  <Input
                    id="edit-bank-account"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm((f) => ({ ...f, accountNumber: e.target.value }))}
                    className="h-9 text-[13px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="edit-bank-ifsc" className="text-[12px] text-[#7e8998]">IFSC Code</Label>
                    <Input
                      id="edit-bank-ifsc"
                      value={bankForm.ifsc}
                      onChange={(e) => setBankForm((f) => ({ ...f, ifsc: e.target.value }))}
                      className="h-9 text-[13px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-bank-name" className="text-[12px] text-[#7e8998]">Bank Name</Label>
                    <Input
                      id="edit-bank-name"
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm((f) => ({ ...f, bankName: e.target.value }))}
                      className="h-9 text-[13px]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

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
                  Open radius review
                </Link>
              )}
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
                      disabled={viewDocument.isPending}
                      onClick={() => viewDocument.mutate(doc.id)}
                      className="h-7 px-3 text-[11px] font-semibold border-[#6366F1] text-[#6366F1] hover:bg-[#EEF2FF] rounded-full"
                    >
                      View image
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
