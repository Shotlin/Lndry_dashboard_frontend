"use client"

/**
 * Fees — the single home for every charge LNDRY configures: the dynamic
 * delivery fee (LNDRY-backend /api/v1/admin/fee-settings), per-order fees
 * (handling / platform / small-cart / surge / packaging / GST), the vendor
 * commission reference rate, the express-pickup surcharge, and the
 * checkout advance-payment amount (/api/v1/admin/settings).
 *
 * Admins set the delivery formula (flat or distance-based) and the
 * free-delivery threshold here. A live preview calculator computes a real
 * breakdown via the backend so the admin sees exactly what a customer
 * would pay for a given subtotal + distance — no values are hardcoded and
 * nothing is computed client-side.
 */

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Calculator,
  Gauge,
  IndianRupee,
  Loader2,
  Route,
  Save,
  Store,
  Truck,
  Wallet,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/shared/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { feeSettingsService } from "@/services/fee-settings.service"
import { useSettings, useUpdateSettings } from "@/hooks/useSettings"
import type {
  DeliveryFeeMode,
  FeeSettings,
  FeePreview,
  FeeValueType,
} from "@/types/fee-settings.types"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object"
  ) {
    const resp = (error as { response?: { data?: { message?: string } } }).response
    if (resp?.data?.message) return resp.data.message
  }
  if (error instanceof Error) return error.message
  return "Something went wrong"
}

function inr(value: number): string {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`
}

/** Parse a numeric input to a number, or null when blank. */
function numOrNull(value: string): number | null {
  if (value.trim() === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function FeesPage() {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<FeeSettings | null>(null)

  const { data: config, isLoading } = useQuery({
    queryKey: ["admin", "fee-settings"],
    queryFn: feeSettingsService.get,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (config) setDraft(config)
  }, [config])

  const updateMutation = useMutation({
    mutationFn: feeSettingsService.update,
    onSuccess: () => {
      toast.success("Fees saved")
      queryClient.invalidateQueries({ queryKey: ["admin", "fee-settings"] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  function set<K extends keyof FeeSettings>(key: K, value: FeeSettings[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d))
  }

  // ── Client-side validation before save ───────────────────────────────────
  const validationError = useMemo(() => {
    if (!draft) return null
    if (draft.min_delivery_fee < 0) return "Minimum delivery fee cannot be negative"
    if (draft.delivery_fee_mode === "DISTANCE") {
      if (draft.base_distance_km < 0) return "Base distance cannot be negative"
      if (draft.per_km_fee < 0) return "Per-km fee cannot be negative"
      if (
        draft.max_delivery_distance_km != null &&
        draft.max_delivery_distance_km < draft.base_distance_km
      ) {
        return "Maximum delivery distance must be greater than or equal to the base distance"
      }
    }
    if (
      draft.free_delivery_enabled &&
      (draft.free_delivery_above == null || draft.free_delivery_above <= 0)
    ) {
      return "Free-delivery threshold must be a positive amount when free delivery is enabled"
    }
    if (draft.vendor_commission_type === "PERCENT" && draft.vendor_commission_value > 100) {
      return "Vendor commission percentage cannot exceed 100"
    }
    if (draft.handling_fee_type === "PERCENT" && draft.handling_fee_value > 100) {
      return "Handling fee percentage cannot exceed 100"
    }
    if (draft.platform_fee_type === "PERCENT" && draft.platform_fee_value > 100) {
      return "Platform fee percentage cannot exceed 100"
    }
    if (draft.gst_rate < 0 || draft.gst_rate > 100) {
      return "GST rate must be between 0 and 100"
    }
    if (draft.express_pickup_fee_paise < 0) {
      return "Express pickup fee cannot be negative"
    }
    return null
  }, [draft])

  function handleSave() {
    if (!draft) return
    if (validationError) {
      toast.error(validationError)
      return
    }
    // Send the full editable config (backend accepts a partial; we send all).
    const { id, scope, shop_id, ...payload } = draft
    void id
    void scope
    void shop_id
    updateMutation.mutate(payload)
  }

  if (isLoading || !draft) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Fees"
          subtitle="Every charge LNDRY configures, in one place."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((__, j) => (
                  <Skeleton key={j} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Fees"
        subtitle="Configure delivery, order, vendor, and payment fees. Changes apply to new orders only."
      >
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save changes
        </Button>
      </PageHeader>

      {validationError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {validationError}
        </div>
      ) : null}

      <SummaryStrip draft={draft} />

      <FeeSection
        icon={Truck}
        title="Delivery"
        description="What the customer pays for pickup + delivery."
      >
        <DeliverySection draft={draft} set={set} />
        <PreviewCalculator />
      </FeeSection>

      <FeeSection
        icon={IndianRupee}
        title="Order Fees"
        description="Extra charges applied on top of the item subtotal."
      >
        <FlatFeeSection
          title="Handling Fee"
          description="Charged on every order to cover packing and handling."
          enabled={draft.handling_fee_enabled}
          onEnabledChange={(v) => set("handling_fee_enabled", v)}
          type={draft.handling_fee_type}
          onTypeChange={(v) => set("handling_fee_type", v)}
          value={draft.handling_fee_value}
          onValueChange={(v) => set("handling_fee_value", v)}
          label={draft.handling_fee_label}
          onLabelChange={(v) => set("handling_fee_label", v)}
          descriptionText={draft.handling_fee_description ?? ""}
          onDescriptionChange={(v) => set("handling_fee_description", v)}
        />
        <FlatFeeSection
          title="Platform Fee"
          description="Supports platform operations and customer support."
          enabled={draft.platform_fee_enabled}
          onEnabledChange={(v) => set("platform_fee_enabled", v)}
          type={draft.platform_fee_type}
          onTypeChange={(v) => set("platform_fee_type", v)}
          value={draft.platform_fee_value}
          onValueChange={(v) => set("platform_fee_value", v)}
          label={draft.platform_fee_label}
          onLabelChange={(v) => set("platform_fee_label", v)}
          descriptionText={draft.platform_fee_description ?? ""}
          onDescriptionChange={(v) => set("platform_fee_description", v)}
        />
        <SmallCartSection draft={draft} set={set} />
        <SimpleFeeSection
          title="Surge / Rain Fee"
          description="Temporary surcharge during high demand or bad weather."
          enabled={draft.surge_fee_enabled}
          onEnabledChange={(v) => set("surge_fee_enabled", v)}
          value={draft.surge_fee_value}
          onValueChange={(v) => set("surge_fee_value", v)}
          label={draft.surge_fee_label}
          onLabelChange={(v) => set("surge_fee_label", v)}
          descriptionText={draft.surge_fee_description ?? ""}
          onDescriptionChange={(v) => set("surge_fee_description", v)}
        />
        <SimpleFeeSection
          title="Packaging Fee"
          description="Covers eco-friendly packaging materials."
          enabled={draft.packaging_fee_enabled}
          onEnabledChange={(v) => set("packaging_fee_enabled", v)}
          value={draft.packaging_fee_value}
          onValueChange={(v) => set("packaging_fee_value", v)}
          label={draft.packaging_fee_label}
          onLabelChange={(v) => set("packaging_fee_label", v)}
          descriptionText={draft.packaging_fee_description ?? ""}
          onDescriptionChange={(v) => set("packaging_fee_description", v)}
        />
        <GstFeeSection
          enabled={draft.gst_enabled}
          onEnabledChange={(v) => set("gst_enabled", v)}
          rate={draft.gst_rate}
          onRateChange={(v) => set("gst_rate", v ?? 0)}
          label={draft.gst_label}
          onLabelChange={(v) => set("gst_label", v)}
        />
      </FeeSection>

      <FeeSection
        icon={Store}
        title="Vendor"
        description="What LNDRY charges the vendor — configured here, not yet deducted automatically."
      >
        <VendorCommissionSection draft={draft} set={set} />
      </FeeSection>

      <FeeSection
        icon={Wallet}
        title="Payments"
        description="Express-delivery surcharge and the checkout advance amount."
      >
        <ExpressPickupFeeSection
          feePaise={draft.express_pickup_fee_paise}
          onFeePaiseChange={(v) => set("express_pickup_fee_paise", v ?? 0)}
        />
        <AdvancePaymentSection />
        <CheckoutContentSection />
      </FeeSection>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section wrapper — icon + title + description header, cards in a grid below
// ─────────────────────────────────────────────────────────────────────────────

function FeeSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold leading-none">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">{children}</div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary strip — at-a-glance badges for the numbers that matter most
// ─────────────────────────────────────────────────────────────────────────────

function SummaryStrip({ draft }: { draft: FeeSettings }) {
  const deliveryLabel =
    draft.delivery_fee_mode === "FLAT"
      ? `${inr(draft.min_delivery_fee)} flat`
      : `${inr(draft.min_delivery_fee)} + ${inr(draft.per_km_fee)}/km after ${draft.base_distance_km}km`

  const items: Array<{ icon: React.ElementType; label: string; value: string }> = [
    {
      icon: draft.delivery_fee_mode === "FLAT" ? IndianRupee : Route,
      label: "Delivery fee",
      value: draft.delivery_fee_enabled ? deliveryLabel : "Off",
    },
    {
      icon: Gauge,
      label: "Free delivery above",
      value:
        draft.free_delivery_enabled && draft.free_delivery_above != null
          ? inr(draft.free_delivery_above)
          : "Off",
    },
    {
      icon: Store,
      label: "Vendor commission",
      value: draft.vendor_commission_enabled
        ? draft.vendor_commission_type === "PERCENT"
          ? `${draft.vendor_commission_value}%`
          : inr(draft.vendor_commission_value)
        : "Off",
    },
    {
      icon: Zap,
      label: "Express pickup fee",
      value: inr(draft.express_pickup_fee_paise / 100),
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">{item.label}</p>
            <p className="truncate text-sm font-semibold">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Delivery fee (flat or distance-based)
// ─────────────────────────────────────────────────────────────────────────────

interface DeliverySectionProps {
  draft: FeeSettings
  set: <K extends keyof FeeSettings>(key: K, value: FeeSettings[K]) => void
}

function NumberField({
  id,
  label,
  value,
  onChange,
  suffix,
  placeholder,
  disabled,
  step,
}: {
  id: string
  label: string
  value: number | null
  onChange: (v: number | null) => void
  suffix?: string
  placeholder?: string
  disabled?: boolean
  step?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={step ?? "0.01"}
          disabled={disabled}
          placeholder={placeholder}
          value={value === null ? "" : String(value)}
          onChange={(e) => onChange(numOrNull(e.target.value))}
          className={suffix ? "pr-12" : undefined}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function DeliverySection({ draft, set }: DeliverySectionProps) {
  const isFlat = draft.delivery_fee_mode === "FLAT"

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Delivery Fee</CardTitle>
            <CardDescription>
              Charged for pickup + delivery on every order.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Enabled</span>
            <Switch
              checked={draft.delivery_fee_enabled}
              onCheckedChange={(v) => set("delivery_fee_enabled", v)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label>Pricing mode</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => set("delivery_fee_mode", "FLAT")}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                isFlat
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-input text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <IndianRupee className="h-4 w-4" />
              Flat amount
            </button>
            <button
              type="button"
              onClick={() => set("delivery_fee_mode", "DISTANCE")}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                !isFlat
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-input text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <Route className="h-4 w-4" />
              Distance-based
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField
            id="min_delivery_fee"
            label={isFlat ? "Delivery fee" : "Minimum delivery fee"}
            suffix="₹"
            value={draft.min_delivery_fee}
            onChange={(v) => set("min_delivery_fee", v ?? 0)}
          />
          {!isFlat ? (
            <>
              <NumberField
                id="base_distance_km"
                label="Base distance included"
                suffix="km"
                value={draft.base_distance_km}
                onChange={(v) => set("base_distance_km", v ?? 0)}
              />
              <NumberField
                id="per_km_fee"
                label="Per-km fee (after base)"
                suffix="₹"
                value={draft.per_km_fee}
                onChange={(v) => set("per_km_fee", v ?? 0)}
              />
            </>
          ) : null}
        </div>

        {!isFlat ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              id="max_delivery_distance_km"
              label="Max delivery distance (optional)"
              suffix="km"
              placeholder="No limit"
              value={draft.max_delivery_distance_km}
              onChange={(v) => set("max_delivery_distance_km", v)}
            />
          </div>
        ) : null}

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Free delivery</p>
            <p className="text-xs text-muted-foreground">
              Waive only the delivery fee when the cart subtotal reaches the threshold.
            </p>
          </div>
          <Switch
            checked={draft.free_delivery_enabled}
            onCheckedChange={(v) => set("free_delivery_enabled", v)}
          />
        </div>
        {draft.free_delivery_enabled ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              id="free_delivery_above"
              label="Free delivery above"
              suffix="₹"
              value={draft.free_delivery_above}
              onChange={(v) => set("free_delivery_above", v)}
            />
          </div>
        ) : null}

        <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          {isFlat ? (
            <>
              Formula: delivery&nbsp;=&nbsp;{inr(draft.min_delivery_fee)} flat, regardless of
              distance
              {draft.free_delivery_enabled && draft.free_delivery_above != null
                ? `, waived above ${inr(draft.free_delivery_above)}`
                : ""}
              .
            </>
          ) : (
            <>
              Formula: delivery&nbsp;=&nbsp;min&nbsp;fee&nbsp;+&nbsp;⌈max(0,&nbsp;distance&nbsp;−&nbsp;base)⌉&nbsp;×&nbsp;per-km&nbsp;fee.
              Distance beyond the max is capped so fees never run away.
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Flat/Percent fee (handling, platform, vendor commission)
// ─────────────────────────────────────────────────────────────────────────────

interface FlatFeeSectionProps {
  title: string
  description: string
  enabled: boolean
  onEnabledChange: (v: boolean) => void
  type: FeeValueType
  onTypeChange: (v: FeeValueType) => void
  value: number
  onValueChange: (v: number) => void
  label: string
  onLabelChange: (v: string) => void
  descriptionText: string
  onDescriptionChange: (v: string) => void
  badge?: string
}

function FlatFeeSection({
  title,
  description,
  enabled,
  onEnabledChange,
  type,
  onTypeChange,
  value,
  onValueChange,
  label,
  onLabelChange,
  descriptionText,
  onDescriptionChange,
  badge,
}: FlatFeeSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{title}</CardTitle>
              {badge ? (
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {badge}
                </Badge>
              ) : null}
            </div>
            <CardDescription>{description}</CardDescription>
          </div>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(v) => onTypeChange(v as FeeValueType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FLAT">Flat amount (₹)</SelectItem>
                <SelectItem value="PERCENT">Percentage of subtotal (%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <NumberField
            id={`${title}-value`}
            label="Value"
            suffix={type === "PERCENT" ? "%" : "₹"}
            value={value}
            onChange={(v) => onValueChange(v ?? 0)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Customer-facing label</Label>
          <Input value={label} maxLength={60} onChange={(e) => onLabelChange(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Description (shown in the bill info)</Label>
          <Textarea
            rows={2}
            maxLength={500}
            value={descriptionText}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Vendor commission (reference-only)
// ─────────────────────────────────────────────────────────────────────────────

function VendorCommissionSection({ draft, set }: DeliverySectionProps) {
  return (
    <div className="lg:col-span-2">
      <FlatFeeSection
        title="Vendor Commission"
        description="What LNDRY intends to charge the vendor per order."
        badge="Not applied to payouts yet"
        enabled={draft.vendor_commission_enabled}
        onEnabledChange={(v) => set("vendor_commission_enabled", v)}
        type={draft.vendor_commission_type}
        onTypeChange={(v) => set("vendor_commission_type", v)}
        value={draft.vendor_commission_value}
        onValueChange={(v) => set("vendor_commission_value", v)}
        label={draft.vendor_commission_label}
        onLabelChange={(v) => set("vendor_commission_label", v)}
        descriptionText={draft.vendor_commission_description ?? ""}
        onDescriptionChange={(v) => set("vendor_commission_description", v)}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Small cart fee
// ─────────────────────────────────────────────────────────────────────────────

function SmallCartSection({ draft, set }: DeliverySectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Small Cart Fee</CardTitle>
            <CardDescription>
              Charged when the subtotal is below the threshold.
            </CardDescription>
          </div>
          <Switch
            checked={draft.small_cart_fee_enabled}
            onCheckedChange={(v) => set("small_cart_fee_enabled", v)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            id="small_cart_threshold"
            label="Apply below cart value"
            suffix="₹"
            value={draft.small_cart_threshold}
            onChange={(v) => set("small_cart_threshold", v ?? 0)}
          />
          <NumberField
            id="small_cart_fee"
            label="Fee amount"
            suffix="₹"
            value={draft.small_cart_fee}
            onChange={(v) => set("small_cart_fee", v ?? 0)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Customer-facing label</Label>
          <Input
            value={draft.small_cart_fee_label}
            maxLength={60}
            onChange={(e) => set("small_cart_fee_label", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            rows={2}
            maxLength={500}
            value={draft.small_cart_fee_description ?? ""}
            onChange={(e) => set("small_cart_fee_description", e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Simple flat fee (surge, packaging)
// ─────────────────────────────────────────────────────────────────────────────

interface SimpleFeeSectionProps {
  title: string
  description: string
  enabled: boolean
  onEnabledChange: (v: boolean) => void
  value: number
  onValueChange: (v: number) => void
  label: string
  onLabelChange: (v: string) => void
  descriptionText: string
  onDescriptionChange: (v: string) => void
}

function SimpleFeeSection({
  title,
  description,
  enabled,
  onEnabledChange,
  value,
  onValueChange,
  label,
  onLabelChange,
  descriptionText,
  onDescriptionChange,
}: SimpleFeeSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <NumberField
          id={`${title}-value`}
          label="Fee amount"
          suffix="₹"
          value={value}
          onChange={(v) => onValueChange(v ?? 0)}
        />
        <div className="space-y-1.5">
          <Label>Customer-facing label</Label>
          <Input value={label} maxLength={60} onChange={(e) => onLabelChange(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            rows={2}
            maxLength={500}
            value={descriptionText}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function GstFeeSection({
  enabled,
  onEnabledChange,
  rate,
  onRateChange,
  label,
  onLabelChange,
}: {
  enabled: boolean
  onEnabledChange: (v: boolean) => void
  rate: number
  onRateChange: (v: number | null) => void
  label: string
  onLabelChange: (v: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">GST / Tax</CardTitle>
            <CardDescription>
              Charged on top of the subtotal, delivery, and every other fee — off
              by default. New orders only; past orders are unaffected.
            </CardDescription>
          </div>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <NumberField
          id="gst-rate"
          label="Tax rate"
          suffix="%"
          value={rate}
          onChange={onRateChange}
          step="0.01"
        />
        <div className="space-y-1.5">
          <Label>Customer-facing label</Label>
          <Input value={label} maxLength={60} onChange={(e) => onLabelChange(e.target.value)} />
        </div>
      </CardContent>
    </Card>
  )
}

function ExpressPickupFeeSection({
  feePaise,
  onFeePaiseChange,
}: {
  feePaise: number
  onFeePaiseChange: (v: number | null) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Express Pickup Fee</CardTitle>
        <CardDescription>
          Flat surcharge when a customer opts into 60-min express pickup, on
          top of the standard 48-hour delivery. Only vendors with express
          pickup turned on (per-vendor, in their profile) offer it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <NumberField
          id="express-pickup-fee"
          label="Fee amount"
          suffix="₹"
          value={feePaise / 100}
          onChange={(v) => onFeePaiseChange(v == null ? null : Math.round(v * 100))}
        />
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Advance payment — separate backend source (/admin/settings),
// so it carries its own local draft + save button rather than sharing the
// page-level fee-settings mutation.
// ─────────────────────────────────────────────────────────────────────────────

function AdvancePaymentSection() {
  const { data: settings, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()
  const [rupees, setRupees] = useState<number | null>(null)

  const savedPaise = settings?.order_advance_amount_paise?.value
  useEffect(() => {
    if (savedPaise !== undefined && savedPaise !== null) {
      setRupees(Number(savedPaise) / 100)
    }
  }, [savedPaise])

  function save() {
    if (rupees == null || rupees < 0) {
      toast.error("Advance amount cannot be negative")
      return
    }
    updateSettings.mutate({ order_advance_amount_paise: Math.round(rupees * 100) })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Advance Payment</CardTitle>
        <CardDescription>
          Fixed amount charged online at checkout before the vendor confirms
          the order; the balance is collected at delivery.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <NumberField
            id="advance-payment"
            label="Advance amount"
            suffix="₹"
            value={rupees}
            onChange={setRupees}
          />
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={save}
          disabled={updateSettings.isPending || isLoading}
        >
          {updateSettings.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save advance amount
        </Button>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Checkout content — the advance-payment / refund copy the customer
// app shows on its payment screen. Same /admin/settings source as the advance
// amount; {amount} is replaced in the app with the live advance amount.
// ─────────────────────────────────────────────────────────────────────────────

const CHECKOUT_CONTENT_FIELDS = [
  {
    key: "checkout_advance_title",
    label: "Advance message — bold text",
    fallback: "Pay {amount} now to confirm pickup.",
  },
  {
    key: "checkout_advance_subtitle",
    label: "Advance message — normal text",
    fallback: "After the vendor checks your clothes, you'll pay the rest at delivery.",
  },
  {
    key: "checkout_refund_title",
    label: "Refund message — bold starting text",
    fallback: "If pickup is not confirmed,",
  },
  {
    key: "checkout_refund_body",
    label: "Refund message — normal remaining text",
    fallback: "your {amount} is refunded automatically to your original payment source.",
  },
] as const

function CheckoutContentSection() {
  const { data: settings, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()
  const [draft, setDraft] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!settings) return
    setDraft(
      Object.fromEntries(
        CHECKOUT_CONTENT_FIELDS.map((f) => {
          const saved = settings[f.key]?.value
          return [f.key, typeof saved === "string" ? saved : f.fallback]
        })
      )
    )
  }, [settings])

  function save() {
    if (CHECKOUT_CONTENT_FIELDS.some((f) => !draft[f.key]?.trim())) {
      toast.error("Checkout messages cannot be empty")
      return
    }
    updateSettings.mutate(
      Object.fromEntries(
        CHECKOUT_CONTENT_FIELDS.map((f) => [f.key, draft[f.key].trim()])
      )
    )
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg">Checkout Content</CardTitle>
        <CardDescription>
          The advance-payment and refund messages on the customer payment
          screen. Use <code className="rounded bg-muted px-1">{"{amount}"}</code>{" "}
          where the advance amount should appear — it updates automatically
          when you change the advance amount above.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {CHECKOUT_CONTENT_FIELDS.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input
                  id={f.key}
                  value={draft[f.key] ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={save}
          disabled={updateSettings.isPending || isLoading}
        >
          {updateSettings.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save checkout content
        </Button>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview calculator — calls the backend so the breakdown is authoritative
// ─────────────────────────────────────────────────────────────────────────────

function PreviewCalculator() {
  const [subtotal, setSubtotal] = useState("350")
  const [distanceKm, setDistanceKm] = useState("2.8")
  const [result, setResult] = useState<FeePreview | null>(null)

  const previewMutation = useMutation({
    mutationFn: feeSettingsService.preview,
    onSuccess: (data) => setResult(data),
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  function run() {
    previewMutation.mutate({
      subtotal: Number(subtotal) || 0,
      distanceKm: distanceKm.trim() === "" ? undefined : Number(distanceKm),
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Preview Calculator</CardTitle>
            <CardDescription>
              Computed by the backend using the saved configuration.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="preview-subtotal">Cart subtotal</Label>
            <Input
              id="preview-subtotal"
              type="number"
              min={0}
              value={subtotal}
              onChange={(e) => setSubtotal(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="preview-distance">Distance (km)</Label>
            <Input
              id="preview-distance"
              type="number"
              min={0}
              step="0.1"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
            />
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={run}
          disabled={previewMutation.isPending}
        >
          {previewMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Calculator className="mr-2 h-4 w-4" />
          )}
          Calculate
        </Button>

        {result ? (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
            <Row label="Items subtotal" value={inr(result.itemsSubtotal)} />
            {result.fees.map((fee) => (
              <Row
                key={fee.code}
                label={fee.label + (fee.waived ? " (waived)" : "")}
                value={
                  fee.waived
                    ? "FREE"
                    : inr(fee.amount)
                }
                muted={fee.waived}
              />
            ))}
            {result.freeDelivery.enabled && !result.freeDelivery.unlocked ? (
              <p className="text-xs text-primary">
                Add {inr(result.freeDelivery.amountToUnlock)} more to unlock free delivery
                {result.freeDelivery.threshold
                  ? ` (above ${inr(result.freeDelivery.threshold)})`
                  : ""}
              </p>
            ) : null}
            {result.freeDelivery.unlocked ? (
              <p className="text-xs text-primary">Free delivery unlocked</p>
            ) : null}
            <Separator />
            <Row
              label="Total payable"
              value={inr(result.totalPayable)}
              bold
            />
            <p className="text-xs text-muted-foreground">
              Distance: {result.distance.known ? result.distance.label : "unknown (fallback)"} ·
              ETA ~{result.deliveryEtaMinutes} mins
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function Row({
  label,
  value,
  bold,
  muted,
}: {
  label: string
  value: string
  bold?: boolean
  muted?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between ${
        bold ? "font-semibold text-foreground" : ""
      } ${muted ? "text-muted-foreground" : ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
