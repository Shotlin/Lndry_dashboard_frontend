"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, CheckCircle2, ClipboardCheck, Loader2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  vendorServicesService,
  type ServiceApprovalStatus,
  type VendorServiceForReview,
} from "@/services/vendor-services.service"

function StatusBadge({ status }: { status: ServiceApprovalStatus }) {
  if (status === "PENDING") {
    return <Badge className="bg-[#FEF3C7] text-[#B45309] hover:bg-[#FEF3C7]">Pending Review</Badge>
  }
  if (status === "REJECTED") {
    return <Badge className="bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEF2F2]">Rejected</Badge>
  }
  return <Badge className="bg-[#ECFDF5] text-[#047857] hover:bg-[#ECFDF5]">Approved</Badge>
}

const DEFAULT_OVERRIDE_REASON =
  "Your submitted price for this subcategory didn't match our marketplace pricing guidelines, so we've adjusted it."

function RateRow({ rate, serviceId }: { rate: VendorServiceForReview["rates"][number]; serviceId: string }) {
  const queryClient = useQueryClient()
  const [value, setValue] = useState(String(rate.rate_paise / 100))
  const [reason, setReason] = useState("")
  const [justSaved, setJustSaved] = useState(false)

  const recalcMutation = useMutation({
    mutationFn: ({ ratePaise, reason }: { ratePaise: number; reason: string }) =>
      vendorServicesService.recalculateRate(rate.rate_id, ratePaise, reason || undefined),
    onSuccess: () => {
      toast.success(`${rate.garment_name} price updated to ₹${value} — vendor notified`)
      queryClient.invalidateQueries({ queryKey: ["vendor-services-review"] })
      setReason("")
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
    },
    onError: () => toast.error("Failed to update price"),
  })

  const dirty = Number(value) !== rate.rate_paise / 100

  return (
    <div className="py-2 border-b border-[#f4f4f8] last:border-0 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-[#080f14] flex items-center gap-2">
            {rate.garment_name}
            {!rate.is_active && (
              <span className="text-[10px] font-bold text-[#94a3b8] uppercase">Off</span>
            )}
          </div>
          <div className="text-[11px] text-[#7e8998]">
            per {rate.unit}
            {rate.demo_price != null && ` · demo ₹${rate.demo_price}`}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[12px] text-[#7e8998]">₹</span>
          <Input
            type="number"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setJustSaved(false)
            }}
            className="w-24 h-8 text-[13px]"
          />
          {justSaved ? (
            <span className="h-8 px-2 flex items-center gap-1 text-[12px] font-semibold text-[#047857]">
              <Check className="h-3.5 w-3.5" />
              Saved
            </span>
          ) : (
            <Button
              size="sm"
              variant={dirty ? "default" : "outline"}
              className={dirty ? "h-8 px-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white" : "h-8 px-2 text-muted-foreground"}
              disabled={!dirty || recalcMutation.isPending}
              onClick={() => recalcMutation.mutate({ ratePaise: Math.round(Number(value) * 100), reason })}
            >
              {recalcMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Recalculate"}
            </Button>
          )}
        </div>
      </div>

      {dirty && (
        <div className="pl-0.5">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Optional — reason shown to the vendor as a notification. Leave blank to send: "${DEFAULT_OVERRIDE_REASON}"`}
            rows={2}
            className="text-[12px]"
          />
        </div>
      )}

      {!dirty && rate.override_reason && (
        <p className="text-[11px] text-[#7e8998] pl-0.5">
          Last adjusted by admin{rate.override_at ? ` on ${new Date(rate.override_at).toLocaleDateString()}` : ""}:{" "}
          <span className="italic">{rate.override_reason}</span>
        </p>
      )}
    </div>
  )
}

function ServiceCard({ service }: { service: VendorServiceForReview }) {
  const queryClient = useQueryClient()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState("")

  const approveMutation = useMutation({
    mutationFn: () => vendorServicesService.approve(service.id),
    onSuccess: () => {
      toast.success(`${service.name} approved — now live for customers`)
      queryClient.invalidateQueries({ queryKey: ["vendor-services-review"] })
    },
    onError: () => toast.error("Failed to approve service"),
  })

  const rejectMutation = useMutation({
    mutationFn: () => vendorServicesService.reject(service.id, reason),
    onSuccess: () => {
      toast.success(`${service.name} rejected`)
      setRejectOpen(false)
      setReason("")
      queryClient.invalidateQueries({ queryKey: ["vendor-services-review"] })
    },
    onError: () => toast.error("Failed to reject service"),
  })

  return (
    <div className="lndry-card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-bold text-[#080f14]">{service.name}</h3>
            <StatusBadge status={service.approval_status} />
          </div>
          <p className="text-[12px] text-[#7e8998] mt-0.5">
            {service.vendor_name} · {service.category_name ?? "Uncategorized"}
          </p>
          {service.description && (
            <p className="text-[12px] text-[#334155] mt-1">{service.description}</p>
          )}
          {service.approval_status === "REJECTED" && service.rejection_reason && (
            <p className="text-[12px] text-[#B91C1C] mt-1">Reason: {service.rejection_reason}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            className="bg-[#059669] hover:bg-[#047857] text-white"
            disabled={approveMutation.isPending}
            onClick={() => approveMutation.mutate()}
          >
            {approveMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            )}
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-[#B91C1C]/30 text-[#B91C1C] hover:bg-[#FEF2F2]"
            onClick={() => setRejectOpen(true)}
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Reject
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-[#e8e8ef] px-3">
        {service.rates.length === 0 ? (
          <p className="text-[12px] text-[#7e8998] py-3">No subcategories selected.</p>
        ) : (
          service.rates.map((rate) => (
            <RateRow key={rate.rate_id} rate={rate} serviceId={service.id} />
          ))
        )}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject &quot;{service.name}&quot;?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason for the vendor (5–500 characters)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Wash & Fold price is below our minimum guideline for this category."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#B91C1C] hover:bg-[#991B1B] text-white"
              disabled={reason.trim().length < 5 || rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}
            >
              {rejectMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Reject Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function VendorServicesReviewPage() {
  const [tab, setTab] = useState<ServiceApprovalStatus>("PENDING")

  const { data, isLoading, error } = useQuery({
    queryKey: ["vendor-services-review", tab],
    queryFn: () => vendorServicesService.getForReview(tab),
    staleTime: 15 * 1000,
  })

  const services = data?.services ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vendor Service Approvals"
        subtitle="Review the categories and prices vendors submit before they go live to customers."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as ServiceApprovalStatus)}>
        <TabsList>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : error ? (
        <div className="lndry-card">
          <p className="text-sm text-red-600">Failed to load vendor services.</p>
        </div>
      ) : services.length === 0 ? (
        <div className="lndry-card">
          <EmptyState
            icon={<ClipboardCheck className="h-6 w-6 text-muted-foreground" />}
            title={`No ${tab.toLowerCase()} services`}
            description="Vendor-submitted services will show up here for review."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  )
}
