"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateReferralProgram, useUpdateReferralProgram } from "@/hooks/useReferralPrograms"
import { useCustomerSegments } from "@/hooks/useCustomerSegments"
import { getCoupons } from "@/services/coupons.service"
import type {
  ReferralProgram,
  CreateReferralProgramPayload,
  ReferralRewardType,
  ReferralTriggerType,
  ReferralProgramTargetType,
} from "@/types/referral-program.types"

interface ReferralProgramDialogProps {
  open: boolean
  onClose: () => void
  program?: ReferralProgram | null
}

const REWARD_TYPE_LABELS: Record<ReferralRewardType, string> = {
  WALLET_CREDIT: "Wallet cashback (₹)",
  FREE_EXPRESS_DELIVERY: "Free express delivery",
  FREE_STANDARD_DELIVERY: "Free standard delivery",
  COUPON_UNLOCK: "Unlock a coupon",
}

const TRIGGER_LABELS: Record<ReferralTriggerType, string> = {
  ON_SIGNUP: "Immediately on signup",
  ON_FIRST_ORDER_COMPLETE: "After first order completes",
}

const TARGET_TYPE_LABELS: Record<ReferralProgramTargetType, string> = {
  ALL: "All customers",
  SEGMENT: "A customer segment",
}

const INITIAL: CreateReferralProgramPayload & { isActive: boolean } = {
  name: "",
  isActive: true,
  targetType: "ALL",
  targetSegmentId: undefined,
  priority: 0,
  validFrom: undefined,
  validUntil: undefined,
  maxReferralsPerReferrer: undefined,
  termsText: "",
  referrerRewardType: "WALLET_CREDIT",
  referrerRewardAmount: undefined,
  referrerRewardCount: undefined,
  referrerUnlockCouponId: undefined,
  referrerTrigger: "ON_FIRST_ORDER_COMPLETE",
  refereeRewardType: "WALLET_CREDIT",
  refereeRewardAmount: undefined,
  refereeRewardCount: undefined,
  refereeUnlockCouponId: undefined,
  refereeTrigger: "ON_FIRST_ORDER_COMPLETE",
}

type FormState = typeof INITIAL

/** One side's reward config (referrer or referee) — identical shape both sides. */
function RewardSideFields({
  title,
  rewardType,
  onRewardType,
  amount,
  onAmount,
  count,
  onCount,
  unlockCouponId,
  onUnlockCouponId,
  trigger,
  onTrigger,
  couponOptions,
}: {
  title: string
  rewardType: ReferralRewardType
  onRewardType: (v: ReferralRewardType) => void
  amount: number | undefined
  onAmount: (v: number | undefined) => void
  count: number | undefined
  onCount: (v: number | undefined) => void
  unlockCouponId: string | undefined
  onUnlockCouponId: (v: string | undefined) => void
  trigger: ReferralTriggerType
  onTrigger: (v: ReferralTriggerType) => void
  couponOptions: { id: string; code: string; targetType?: string | null; isActive: boolean }[]
}) {
  return (
    <div className="rounded-md border p-3 space-y-3">
      <p className="text-sm font-medium">{title}</p>

      <div className="space-y-1.5">
        <Label>Reward Type *</Label>
        <Select value={rewardType} onValueChange={(v) => onRewardType(v as ReferralRewardType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(REWARD_TYPE_LABELS) as ReferralRewardType[]).map((type) => (
              <SelectItem key={type} value={type}>
                {REWARD_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {rewardType === "WALLET_CREDIT" && (
        <div className="space-y-1.5">
          <Label>Amount (₹) *</Label>
          <Input
            type="number"
            min={0}
            value={amount ?? ""}
            onChange={(e) => onAmount(e.target.value ? parseFloat(e.target.value) : undefined)}
            required
          />
        </div>
      )}

      {(rewardType === "FREE_EXPRESS_DELIVERY" || rewardType === "FREE_STANDARD_DELIVERY") && (
        <div className="space-y-1.5">
          <Label>Number of Free Deliveries *</Label>
          <Input
            type="number"
            min={1}
            value={count ?? ""}
            onChange={(e) => onCount(e.target.value ? parseInt(e.target.value) : undefined)}
            required
          />
        </div>
      )}

      {rewardType === "COUPON_UNLOCK" && (
        <div className="space-y-1.5">
          <Label>Coupon to Unlock *</Label>
          <Select value={unlockCouponId ?? ""} onValueChange={(v) => onUnlockCouponId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a coupon..." />
            </SelectTrigger>
            <SelectContent>
              {couponOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.code}
                  {(c.targetType !== "INDIVIDUAL" || !c.isActive) && " ⚠️ won't work as-is"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Only active coupons with Target Audience &quot;Specific customers&quot; actually work as an unlock.
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Grant Timing *</Label>
        <Select value={trigger} onValueChange={(v) => onTrigger(v as ReferralTriggerType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(TRIGGER_LABELS) as ReferralTriggerType[]).map((t) => (
              <SelectItem key={t} value={t}>
                {TRIGGER_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export function ReferralProgramDialog({ open, onClose, program }: ReferralProgramDialogProps) {
  const [form, setForm] = useState<FormState>(INITIAL)
  const isEdit = !!program
  const createMutation = useCreateReferralProgram()
  const updateMutation = useUpdateReferralProgram()
  const { data: segments } = useCustomerSegments()
  const { data: coupons = [] } = useQuery({ queryKey: ["coupons"], queryFn: getCoupons })

  useEffect(() => {
    if (program) {
      setForm({
        name: program.name,
        isActive: program.isActive,
        targetType: program.targetType,
        targetSegmentId: program.targetSegmentId ?? undefined,
        priority: program.priority,
        validFrom: program.validFrom ?? undefined,
        validUntil: program.validUntil ?? undefined,
        maxReferralsPerReferrer: program.maxReferralsPerReferrer ?? undefined,
        termsText: program.termsText ?? "",
        referrerRewardType: program.referrerRewardType,
        referrerRewardAmount: program.referrerRewardAmount ?? undefined,
        referrerRewardCount: program.referrerRewardCount ?? undefined,
        referrerUnlockCouponId: program.referrerUnlockCouponId ?? undefined,
        referrerTrigger: program.referrerTrigger,
        refereeRewardType: program.refereeRewardType,
        refereeRewardAmount: program.refereeRewardAmount ?? undefined,
        refereeRewardCount: program.refereeRewardCount ?? undefined,
        refereeUnlockCouponId: program.refereeUnlockCouponId ?? undefined,
        refereeTrigger: program.refereeTrigger,
      })
    } else {
      setForm(INITIAL)
    }
  }, [program, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const { isActive, ...rest } = form
    const payload = { ...rest, termsText: rest.termsText || undefined }
    if (isEdit && program) {
      updateMutation.mutate({ id: program.id, payload: { ...payload, isActive } }, { onSuccess: onClose })
    } else {
      createMutation.mutate(payload, { onSuccess: onClose })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const eligibleCoupons = coupons.filter((c) => c.targetType === "INDIVIDUAL" && c.isActive)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Referral Program" : "Create Referral Program"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rp-name">Program Name *</Label>
            <Input
              id="rp-name"
              placeholder="e.g. Diwali ₹50/₹50 Referral"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              maxLength={150}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <RewardSideFields
              title="Referrer gets"
              rewardType={form.referrerRewardType}
              onRewardType={(v) => setForm({ ...form, referrerRewardType: v })}
              amount={form.referrerRewardAmount}
              onAmount={(v) => setForm({ ...form, referrerRewardAmount: v })}
              count={form.referrerRewardCount}
              onCount={(v) => setForm({ ...form, referrerRewardCount: v })}
              unlockCouponId={form.referrerUnlockCouponId}
              onUnlockCouponId={(v) => setForm({ ...form, referrerUnlockCouponId: v })}
              trigger={form.referrerTrigger ?? "ON_FIRST_ORDER_COMPLETE"}
              onTrigger={(v) => setForm({ ...form, referrerTrigger: v })}
              couponOptions={eligibleCoupons}
            />
            <RewardSideFields
              title="Referee gets"
              rewardType={form.refereeRewardType}
              onRewardType={(v) => setForm({ ...form, refereeRewardType: v })}
              amount={form.refereeRewardAmount}
              onAmount={(v) => setForm({ ...form, refereeRewardAmount: v })}
              count={form.refereeRewardCount}
              onCount={(v) => setForm({ ...form, refereeRewardCount: v })}
              unlockCouponId={form.refereeUnlockCouponId}
              onUnlockCouponId={(v) => setForm({ ...form, refereeUnlockCouponId: v })}
              trigger={form.refereeTrigger ?? "ON_FIRST_ORDER_COMPLETE"}
              onTrigger={(v) => setForm({ ...form, refereeTrigger: v })}
              couponOptions={eligibleCoupons}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Who Can Refer?</Label>
              <Select
                value={form.targetType}
                onValueChange={(v) => setForm({ ...form, targetType: v as ReferralProgramTargetType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TARGET_TYPE_LABELS) as ReferralProgramTargetType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {TARGET_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Checked against the person sharing the code (the referrer), not the new signup.
              </p>
            </div>
            {form.targetType === "SEGMENT" && (
              <div className="space-y-1.5">
                <Label>Segment</Label>
                <Select
                  value={form.targetSegmentId ?? ""}
                  onValueChange={(v) => setForm({ ...form, targetSegmentId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(segments ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rp-priority">Priority</Label>
            <Input
              id="rp-priority"
              type="number"
              value={form.priority ?? 0}
              onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground">
              When more than one active program applies to the same referrer, the highest priority wins.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rp-valid-from">Valid From</Label>
              <Input
                id="rp-valid-from"
                type="date"
                value={form.validFrom ? form.validFrom.slice(0, 10) : ""}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rp-valid-until">Valid Until</Label>
              <Input
                id="rp-valid-until"
                type="date"
                value={form.validUntil ? form.validUntil.slice(0, 10) : ""}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value || undefined })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rp-max-referrals">Max Referrals Per Referrer</Label>
            <Input
              id="rp-max-referrals"
              type="number"
              min={1}
              placeholder="Unlimited"
              value={form.maxReferralsPerReferrer ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  maxReferralsPerReferrer: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Caps only the referrer&apos;s own reward — a referee past the cap still gets their side.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rp-terms">Terms &amp; Conditions</Label>
            <Textarea
              id="rp-terms"
              rows={3}
              placeholder="Shown to customers on the Refer & Earn screen"
              value={form.termsText ?? ""}
              onChange={(e) => setForm({ ...form, termsText: e.target.value })}
            />
          </div>

          {isEdit && (
            <div className="flex items-center gap-3">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label>Active</Label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
