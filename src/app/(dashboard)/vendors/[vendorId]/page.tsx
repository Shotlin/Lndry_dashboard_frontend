"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Store, Loader2, FileText, Eye, AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useVendorDetails } from "@/hooks/useVendorDetail"
import { DocumentPreviewDialog } from "@/components/shared/DocumentPreviewDialog"
import { VendorCapacityTab } from "@/components/vendors/VendorCapacityTab"

function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground max-w-sm">{description}</p>
      </CardContent>
    </Card>
  )
}

function DocumentStatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") return <Badge className="bg-success-bg text-success border-0">VERIFIED</Badge>
  if (status === "REJECTED") return <Badge className="bg-danger-bg text-danger border-0">REJECTED</Badge>
  return <Badge className="bg-muted text-muted-foreground border-0">PENDING</Badge>
}

export default function VendorDetailPage({ params }: { params: { vendorId: string } }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("documents")
  const { data: vendor, isLoading, isError } = useVendorDetails(params.vendorId)
  const [previewDocId, setPreviewDocId] = useState<string | null>(null)
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
            <div className="flex items-center gap-2">
              <Badge className="bg-info-bg text-info border-0 px-2.5 py-0.5">{vendor.status}</Badge>
              {vendor.is_active !== undefined && (
                <Badge className={vendor.is_active ? "bg-success-bg text-success border-0 px-2.5 py-0.5" : "bg-muted text-muted-foreground border-0 px-2.5 py-0.5"}>
                  {vendor.is_active ? "ACTIVE" : "INACTIVE"}
                </Badge>
              )}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-10 w-full justify-start overflow-x-auto flex-nowrap border-b bg-transparent p-0 rounded-none">
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
              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Onboarding Documents</CardTitle>
                    <CardDescription>KYC verification and license attachments</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="services" className="space-y-4">
                <ComingSoon
                  title="Services & rates not available yet"
                  description="There is no admin-facing endpoint for a vendor's services and garment rates yet. This tab will populate once that's built."
                />
              </TabsContent>

              <TabsContent value="employees" className="space-y-4">
                <ComingSoon
                  title="Employees view not available yet"
                  description="The backend already supports vendor staff management, but the dashboard doesn't have a service wired up for it yet."
                />
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
