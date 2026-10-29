"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Store, Loader2, FileText, Eye, Zap, Trash2, Upload } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { adminUploadVendorDocument, adminDeleteVendorDocument, KYC_DOCUMENT_TYPES } from "@/services/vendors.service"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useVendorDetails, useSetExpressPickup } from "@/hooks/useVendorDetail"
import { DocumentPreviewDialog } from "@/components/shared/DocumentPreviewDialog"
import { VendorCapacityTab } from "@/components/vendors/VendorCapacityTab"
import { VendorEmployeesTab } from "@/components/vendors/VendorEmployeesTab"
import { VendorDetailsSection } from "@/components/vendors/VendorDetailsSection"
import { VendorServicesTab } from "@/components/vendors/VendorServicesTab"
import { VendorTypeControl } from "@/components/vendors/VendorTypeControl"
import { VendorOfferingControl } from "@/components/vendors/VendorOfferingControl"
import { GoogleBusinessControl } from "@/components/vendors/GoogleBusinessControl"

function DocumentStatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") return <Badge className="bg-success-bg text-success border-0">VERIFIED</Badge>
  if (status === "REJECTED") return <Badge className="bg-danger-bg text-danger border-0">REJECTED</Badge>
  return <Badge className="bg-muted text-muted-foreground border-0">PENDING</Badge>
}

export default function VendorDetailPage(props: { params: Promise<{ vendorId: string }> }) {
  const params = use(props.params)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("details")
  const { data: vendor, isLoading, isError } = useVendorDetails(params.vendorId)
  const setExpressPickup = useSetExpressPickup(params.vendorId)
  const [previewDocId, setPreviewDocId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const [docType, setDocType] = useState<string>(KYC_DOCUMENT_TYPES[0].value)
  const [docBusy, setDocBusy] = useState(false)
  const refreshVendor = () => queryClient.invalidateQueries({ queryKey: ["vendors", "detail", params.vendorId] })
  const uploadDoc = async (file?: File) => {
    if (!file) return
    setDocBusy(true)
    try {
      await adminUploadVendorDocument(params.vendorId, docType, file)
      toast.success("Document uploaded")
      refreshVendor()
    } catch (e) {
      toast.error((e as Error).message || "Upload failed")
    } finally {
      setDocBusy(false)
    }
  }
  const removeDoc = async (id: string) => {
    try {
      await adminDeleteVendorDocument(params.vendorId, id)
      toast.success("Document removed")
      refreshVendor()
    } catch (e) {
      toast.error((e as Error).message || "Could not remove document")
    }
  }
  const previewDoc = vendor?.documents.find((d) => d.id === previewDocId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-muted-foreground pl-1">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to list
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading vendor…
        </div>
      )}

      {isError && !isLoading && (
        <PageHeader title="Vendor not found" subtitle={`No vendor or application matches ID ${params.vendorId}`} />
      )}

      {vendor && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 p-2.5">
                <Store className="h-full w-full text-brand-500 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display text-foreground">{vendor.name}</h1>
                <p className="text-sm text-muted-foreground">
                  ID: {vendor.id} {vendor.city ? `· ${vendor.city}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-info-bg text-info border-0 px-2.5 py-0.5">{vendor.status}</Badge>
                {vendor.is_active !== undefined && (
                  <Badge className={vendor.is_active ? "bg-success-bg text-success border-0 px-2.5 py-0.5" : "bg-muted text-muted-foreground border-0 px-2.5 py-0.5"}>
                    {vendor.is_active ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                )}
              </div>
              {vendor.status === "APPROVED" && vendor.vendor_type && (
                <VendorTypeControl vendorId={params.vendorId} current={vendor.vendor_type} />
              )}
              {vendor.status === "APPROVED" && vendor.offering && (
                <VendorOfferingControl
                  vendorId={params.vendorId}
                  offering={vendor.offering}
                  onboardingStatus={vendor.pos_onboarding_status}
                  planName={vendor.pos_plan_name}
                  validTo={vendor.pos_valid_to}
                />
              )}
              {vendor.status === "APPROVED" && (
                <div className="flex items-center gap-2 rounded-full border px-3 py-1.5">
                  <Zap className="h-3.5 w-3.5 text-brand-500" />
                  <span className="text-xs font-semibold text-foreground">Express Pickup</span>
                  <Switch
                    checked={!!vendor.express_pickup_available}
                    disabled={setExpressPickup.isPending}
                    onCheckedChange={(checked) => setExpressPickup.mutate(checked)}
                  />
                </div>
              )}
            </div>
          </div>

          {vendor.status === "APPROVED" && (
            <GoogleBusinessControl vendorId={params.vendorId} vendor={vendor} />
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-10 w-full justify-start overflow-x-auto flex-nowrap border-b bg-transparent p-0 rounded-none">
              <TabsTrigger value="details" className="text-sm px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-brand-500 data-[state=active]:bg-transparent data-[state=active]:text-brand-500 font-semibold">
                Details
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-sm px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-brand-500 data-[state=active]:bg-transparent data-[state=active]:text-brand-500 font-semibold">
                KYC Documents
              </TabsTrigger>
              <TabsTrigger value="services" className="text-sm px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-brand-500 data-[state=active]:bg-transparent data-[state=active]:text-brand-500 font-semibold">
                Services & Rates
              </TabsTrigger>
              <TabsTrigger value="employees" className="text-sm px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-brand-500 data-[state=active]:bg-transparent data-[state=active]:text-brand-500 font-semibold">
                Employees
              </TabsTrigger>
              <TabsTrigger value="slots" className="text-sm px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-brand-500 data-[state=active]:bg-transparent data-[state=active]:text-brand-500 font-semibold">
                Capacity & Slots
              </TabsTrigger>
            </TabsList>

            <div className="pt-6">
              <TabsContent value="details" className="space-y-4">
                <VendorDetailsSection id={params.vendorId} vendor={vendor} />
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Onboarding Documents</CardTitle>
                    <CardDescription>KYC verification and license attachments</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {vendor.status === "APPROVED" && (
                      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed p-3">
                        <select
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                          className="h-9 rounded-md border bg-background px-2 text-sm"
                        >
                          {KYC_DOCUMENT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                        <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-brand-600 px-3 text-sm font-semibold text-white hover:bg-brand-700">
                          {docBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          Upload
                          <input type="file" accept="image/*,application/pdf" className="sr-only" disabled={docBusy}
                            onChange={(e) => { uploadDoc(e.target.files?.[0]); e.target.value = "" }} />
                        </label>
                        <span className="text-xs text-muted-foreground">Uploading again replaces the earlier file of that type.</span>
                      </div>
                    )}
                    {vendor.documents.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-8 text-center">No documents uploaded.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {vendor.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                            <div className="flex items-center gap-3">
                              <FileText className="h-8 w-8 text-brand-500" />
                              <div>
                                <p className="text-sm font-semibold">{doc.document_type.replace(/_/g, " ")}</p>
                                {doc.rejection_reason && (
                                  <p className="text-xs text-danger mt-0.5">{doc.rejection_reason}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <DocumentStatusBadge status={doc.status} />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => setPreviewDocId(doc.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {vendor.status === "APPROVED" && (
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-danger hover:text-danger" onClick={() => removeDoc(doc.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="services" className="space-y-4">
                <VendorServicesTab vendorId={params.vendorId} />
              </TabsContent>

              <TabsContent value="employees" className="space-y-4">
                <VendorEmployeesTab vendorId={params.vendorId} />
              </TabsContent>

              <TabsContent value="slots" className="space-y-4">
                <VendorCapacityTab vendorId={params.vendorId} />
              </TabsContent>
            </div>
          </Tabs>
        </>
      )}

      <DocumentPreviewDialog
        documentId={previewDocId}
        title={previewDoc?.document_type.replace(/_/g, " ")}
        onOpenChange={(open) => !open && setPreviewDocId(null)}
      />
    </div>
  )
}
