"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUpdateVendorApplicationDetails } from "@/hooks/useVendorApplications"
import type { Vendor } from "@/services/vendors.service"

// Shared by both the vendor-applications review page and the approved-vendor
// detail page — both PATCH the same admin endpoint (`/vendors/admin/:id`,
// resolved to either table via _resolveReviewTarget), so one edit UI covers
// both stages instead of duplicating the cards.
export function VendorDetailsSection({ id, vendor }: { id: string; vendor: Vendor }) {
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
    setEditForm({
      ownerName: vendor.owner_name ?? "",
      name: vendor.name ?? "",
      description: vendor.description ?? "",
      email: vendor.email ?? "",
      gstNumber: vendor.gst_number ?? "",
      panNumber: vendor.pan_number ?? "",
    })
    setIsEditingDetails(true)
  }

  function saveEditing() {
    updateDetails.mutate(
      {
        id,
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
    setBankForm({
      accountHolder: vendor.bank_holder_name ?? "",
      accountNumber: vendor.bank_account_number ?? "",
      ifsc: vendor.bank_ifsc ?? "",
      bankName: vendor.bank_name ?? "",
    })
    setIsEditingBank(true)
  }

  function saveBankEditing() {
    updateDetails.mutate(
      {
        id,
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            <div className="flex justify-between"><span className="text-[#7e8998]">Owner</span><span className="text-[#080f14] font-medium">{vendor.owner_name || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-[#7e8998]">Business</span><span className="text-[#080f14] font-medium">{vendor.name || "N/A"}</span></div>
            <div className="pt-1 pb-1 border-t border-[#f4f4f8]">
              <span className="text-[#7e8998] block mb-1">Description</span>
              <p className="text-[#080f14] font-medium leading-relaxed">{vendor.description || "N/A"}</p>
            </div>
            <div className="flex justify-between border-t border-[#f4f4f8] pt-3"><span className="text-[#7e8998]">Email</span><span className="text-[#080f14] font-medium">{vendor.email || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-[#7e8998]">GST / PAN</span><span className="text-[#080f14] font-medium">{vendor.gst_number || "N/A"} / {vendor.pan_number || "N/A"}</span></div>
            <div className="flex justify-between">
              <span className="text-[#7e8998]">Mobile</span>
              <span className="text-[#080f14] font-medium">{vendor.phone ? `+91 ${vendor.phone}` : "N/A"}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            <div className="space-y-1">
              <Label htmlFor="vd-owner-name" className="text-[12px] text-[#7e8998]">Owner</Label>
              <Input id="vd-owner-name" value={editForm.ownerName} onChange={(e) => setEditForm((f) => ({ ...f, ownerName: e.target.value }))} placeholder="Owner's full name" className="h-9 text-[13px]" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vd-business-name" className="text-[12px] text-[#7e8998]">Business</Label>
              <Input id="vd-business-name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder="Business name" className="h-9 text-[13px]" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vd-description" className="text-[12px] text-[#7e8998]">Description</Label>
              <Textarea id="vd-description" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} placeholder="What the vendor's shop specializes in" className="min-h-[70px] text-[13px]" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vd-email" className="text-[12px] text-[#7e8998]">Email</Label>
              <Input id="vd-email" type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} placeholder="owner@example.com" className="h-9 text-[13px]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="vd-gst" className="text-[12px] text-[#7e8998]">GST Number</Label>
                <Input id="vd-gst" value={editForm.gstNumber} onChange={(e) => setEditForm((f) => ({ ...f, gstNumber: e.target.value }))} className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="vd-pan" className="text-[12px] text-[#7e8998]">PAN Number</Label>
                <Input id="vd-pan" value={editForm.panNumber} onChange={(e) => setEditForm((f) => ({ ...f, panNumber: e.target.value }))} className="h-9 text-[13px]" />
              </div>
            </div>
            <div className="flex justify-between text-[13px] pt-1">
              <span className="text-[#7e8998]">Mobile</span>
              <span className="text-[#080f14] font-medium">{vendor.phone ? `+91 ${vendor.phone}` : "N/A"}</span>
            </div>
            <p className="text-[11px] text-[#7e8998]">Mobile number is tied to the vendor's login and can't be changed here.</p>
          </div>
        )}
      </div>

      {/* Bank details */}
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
            <div className="flex justify-between"><span className="text-[#7e8998]">Account Holder</span><span className="text-[#080f14] font-medium">{vendor.bank_holder_name || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-[#7e8998]">Account Number</span><span className="text-[#080f14] font-medium">{vendor.bank_account_number || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-[#7e8998]">IFSC Code</span><span className="text-[#080f14] font-medium">{vendor.bank_ifsc || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-[#7e8998]">Bank Name</span><span className="text-[#080f14] font-medium">{vendor.bank_name || "N/A"}</span></div>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            <div className="space-y-1">
              <Label htmlFor="vd-bank-holder" className="text-[12px] text-[#7e8998]">Account Holder</Label>
              <Input id="vd-bank-holder" value={bankForm.accountHolder} onChange={(e) => setBankForm((f) => ({ ...f, accountHolder: e.target.value }))} className="h-9 text-[13px]" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vd-bank-account" className="text-[12px] text-[#7e8998]">Account Number</Label>
              <Input id="vd-bank-account" value={bankForm.accountNumber} onChange={(e) => setBankForm((f) => ({ ...f, accountNumber: e.target.value }))} className="h-9 text-[13px]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="vd-bank-ifsc" className="text-[12px] text-[#7e8998]">IFSC Code</Label>
                <Input id="vd-bank-ifsc" value={bankForm.ifsc} onChange={(e) => setBankForm((f) => ({ ...f, ifsc: e.target.value }))} className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="vd-bank-name" className="text-[12px] text-[#7e8998]">Bank Name</Label>
                <Input id="vd-bank-name" value={bankForm.bankName} onChange={(e) => setBankForm((f) => ({ ...f, bankName: e.target.value }))} className="h-9 text-[13px]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
