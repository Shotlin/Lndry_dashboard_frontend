"use client"

import { PageHeader } from "@/components/shared/PageHeader"
import { ServiceRequestsPanel } from "@/components/vendors/ServiceRequestsPanel"

export default function VendorServicesReviewPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Vendor Service Approvals"
        subtitle="Review the categories and prices vendors submit before they go live to customers."
      />
      <ServiceRequestsPanel />
    </div>
  )
}
