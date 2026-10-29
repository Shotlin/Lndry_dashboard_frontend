"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Upload } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  adminCreateVendor,
  adminUploadVendorDocument,
  KYC_DOCUMENT_TYPES,
  type AdminCreateVendorInput,
} from "@/services/vendors.service"

type Form = Record<string, string>

const EMPTY: Form = {
  name: "", owner_name: "", phone: "", email: "", description: "",
  address_line1: "", address_line2: "", city: "", state: "", pincode: "", lat: "", lng: "",
  gst_number: "", pan_number: "", bank_holder_name: "", bank_name: "", bank_account_number: "", bank_ifsc: "",
  service_radius_km: "5", daily_capacity: "",
}

function Field({ label, name, form, set, required, placeholder, type = "text" }: {
  label: string; name: string; form: Form; set: (k: string, v: string) => void
  required?: boolean; placeholder?: string; type?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}{required && <span className="text-danger"> *</span>}</Label>
      <Input id={name} type={type} value={form[name]} placeholder={placeholder} onChange={(e) => set(name, e.target.value)} />
    </div>
  )
}

export default function NewVendorPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Form>(EMPTY)
  const [files, setFiles] = useState<Record<string, File | undefined>>({})
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const create = useMutation({
    mutationFn: async () => {
      const lat = Number(form.lat)
      const lng = Number(form.lng)
      const optional = (k: string) => (form[k].trim() ? form[k].trim() : undefined)
      const payload: AdminCreateVendorInput = {
        phone: form.phone.trim(),
        name: form.name.trim(),
        owner_name: form.owner_name.trim(),
        email: optional("email"),
        description: optional("description"),
        address_line1: form.address_line1.trim(),
        address_line2: optional("address_line2"),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        lat,
        lng,
        gst_number: optional("gst_number"),
        pan_number: optional("pan_number"),
        bank_holder_name: optional("bank_holder_name"),
        bank_name: optional("bank_name"),
        bank_account_number: optional("bank_account_number"),
        bank_ifsc: optional("bank_ifsc"),
        service_radius_km: form.service_radius_km ? Number(form.service_radius_km) : undefined,
        daily_capacity: form.daily_capacity ? Number(form.daily_capacity) : undefined,
      }
      const vendor = await adminCreateVendor(payload)
      // The vendor exists now; a failed document must not hide that, so report per file.
      const failed: string[] = []
      for (const [type, file] of Object.entries(files)) {
        if (!file) continue
        try {
          await adminUploadVendorDocument(vendor.id, type, file)
        } catch {
          failed.push(KYC_DOCUMENT_TYPES.find((d) => d.value === type)?.label ?? type)
        }
      }
      return { vendor, failed }
    },
    onSuccess: ({ vendor, failed }) => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] })
      if (failed.length) toast.warning(`Vendor created, but these documents failed to upload: ${failed.join(", ")}. Add them from the KYC tab.`)
      else toast.success("Vendor created. The owner can now sign in with their mobile number.")
      router.push(`/vendors/${vendor.id}`)
    },
    onError: (error: Error) => toast.error(error.message || "Could not create the vendor"),
  })

  const missing = !form.name.trim() || !form.owner_name.trim() || !form.phone.trim() || !form.address_line1.trim() ||
    !form.city.trim() || !form.state.trim() || !form.pincode.trim() || form.lat === "" || form.lng === "" ||
    Number.isNaN(Number(form.lat)) || Number.isNaN(Number(form.lng))

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-muted-foreground pl-1">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to vendors
      </Button>
      <PageHeader title="Add vendor" subtitle="Creates an approved vendor. The owner signs in to the Partner app with this mobile number (OTP)." />

      <Card>
        <CardHeader><CardTitle>Owner &amp; business</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name" name="name" form={form} set={set} required />
          <Field label="Owner name" name="owner_name" form={form} set={set} required />
          <Field label="Owner mobile number" name="phone" form={form} set={set} required placeholder="10-digit number" />
          <Field label="Email" name="email" form={form} set={set} type="email" />
          <div className="sm:col-span-2"><Field label="Description" name="description" form={form} set={set} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Shop location</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Address" name="address_line1" form={form} set={set} required /></div>
          <div className="sm:col-span-2"><Field label="Address line 2" name="address_line2" form={form} set={set} /></div>
          <Field label="City" name="city" form={form} set={set} required />
          <Field label="State" name="state" form={form} set={set} required />
          <Field label="Pincode" name="pincode" form={form} set={set} required />
          <div />
          <Field label="Latitude" name="lat" form={form} set={set} required placeholder="e.g. 12.9716" />
          <Field label="Longitude" name="lng" form={form} set={set} required placeholder="e.g. 77.5946" />
          <Field label="Service radius (km)" name="service_radius_km" form={form} set={set} type="number" />
          <Field label="Daily order capacity" name="daily_capacity" form={form} set={set} type="number" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tax &amp; bank</CardTitle><CardDescription>Optional now; can be edited later.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="GST number" name="gst_number" form={form} set={set} />
          <Field label="PAN number" name="pan_number" form={form} set={set} />
          <Field label="Account holder" name="bank_holder_name" form={form} set={set} />
          <Field label="Bank name" name="bank_name" form={form} set={set} />
          <Field label="Account number" name="bank_account_number" form={form} set={set} />
          <Field label="IFSC" name="bank_ifsc" form={form} set={set} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Attach what the vendor sent on WhatsApp. Documents you upload are marked verified.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {KYC_DOCUMENT_TYPES.map((d) => (
            <label key={d.value} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm cursor-pointer hover:bg-muted/30">
              <span className="flex items-center gap-2 min-w-0">
                <Upload className="h-4 w-4 shrink-0 text-brand-500" />
                <span className="truncate">{files[d.value]?.name ?? d.label}</span>
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                onChange={(e) => setFiles((f) => ({ ...f, [d.value]: e.target.files?.[0] }))}
              />
              <span className="text-xs text-muted-foreground">{files[d.value] ? "Change" : "Choose"}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pb-8">
        <Button variant="outline" onClick={() => router.back()} disabled={create.isPending}>Cancel</Button>
        <Button onClick={() => create.mutate()} disabled={missing || create.isPending}>
          {create.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
          Create vendor
        </Button>
      </div>
      <p className="text-xs text-muted-foreground -mt-6">After creating, add services and prices from the vendor&apos;s &ldquo;Services &amp; Rates&rdquo; tab.</p>
    </div>
  )
}
