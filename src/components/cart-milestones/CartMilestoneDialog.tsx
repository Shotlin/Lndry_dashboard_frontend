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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateCartMilestone, useUpdateCartMilestone } from "@/hooks/useCartMilestones"
import { useCustomerSegments } from "@/hooks/useCustomerSegments"
import { getCoupons } from "@/services/coupons.service"
import type {
  CartMilestone,
  CreateCartMilestonePayload,
  CartMilestoneRewardType,
  CartMilestoneUserType,
} from "@/types/cart-milestone.types"

interface CartMilestoneDialogProps {
  open: boolean
  onClose: () => void
  milestone?: CartMilestone | null
}

const REWARD_TYPE_LABELS: Record<CartMilestoneRewardType, string> = {
  FLAT_DISCOUNT: "Flat discount (₹)",
  COUPON_UNLOCK: "Unlock a coupon",
}

const USER_TYPE_LABELS: Record<CartMilestoneUserType, string> = {
  ALL: "All users",
  FIRST_TIME: "First-time users only",
  SEGMENT: "A customer segment",
}

const INITIAL: CreateCartMilestonePayload & { isActive: boolean } = {
  name: "",
  minOrderAmount: 0,
  rewardType: "FLAT_DISCOUNT",
  rewardValue: undefined,
  unlockCouponId: undefined,
  messageBefore: "",
  messageAfter: "",
  applicableUserType: "ALL",
  applicableSegmentId: undefined,
  stackableWithCoupon: true,
  usageLimitPerUser: undefined,
  isActive: true,
}

export function CartMilestoneDialog({ open, onClose, milestone }: CartMilestoneDialogProps) {
  const [form, setForm] = useState(INITIAL)
  const isEdit = !!milestone
  const createMutation = useCreateCartMilestone()
  const updateMutation = useUpdateCartMilestone()
  const { data: segments } = useCustomerSegments()
  const { data: coupons = [] } = useQuery({ queryKey: ["coupons"], queryFn: getCoupons })

  useEffect(() => {
    if (milestone) {
      setForm({
        name: milestone.name,
        minOrderAmount: milestone.minOrderAmount,
        rewardType: milestone.rewardType,
        rewardValue: milestone.rewardValue ?? undefined,
        unlockCouponId: milestone.unlockCouponId ?? undefined,
        messageBefore: milestone.messageBefore ?? "",
        messageAfter: milestone.messageAfter ?? "",
        applicableUserType: milestone.applicableUserType,
        applicableSegmentId: milestone.applicableSegmentId ?? undefined,
        stackableWithCoupon: milestone.stackableWithCoupon,
        usageLimitPerUser: milestone.usageLimitPerUser ?? undefined,
        isActive: milestone.isActive,
      })
    } else {
      setForm(INITIAL)
    }
  }, [milestone, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const { isActive, ...rest } = form
    const payload = {
      ...rest,
      messageBefore: rest.messageBefore || undefined,
      messageAfter: rest.messageAfter || undefined,
    }
    if (isEdit && milestone) {
      updateMutation.mutate({ id: milestone.id, payload: { ...payload, isActive } }, { onSuccess: onClose })
    } else {
      createMutation.mutate(payload, { onSuccess: onClose })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const showRewardValue = form.rewardType === "FLAT_DISCOUNT"
  const showCouponPicker = form.rewardType === "COUPON_UNLOCK"

  // A milestone "unlocks" a coupon by adding the customer to that coupon's
  // individual target list — coupons.service.js only ever consults that
  // list for a coupon whose own Target Audience is "Specific customers".
  // Any other audience runs its own separate eligibility rule instead and
  // ignores the unlock entirely, so linking one here would silently do
  // nothing. Only offering compatible, active coupons prevents that
  // dead-end rather than surfacing it as a save error.
  const eligibleCoupons = coupons.filter((c) => c.targetType === "INDIVIDUAL" && c.isActive)
  const currentCoupon = form.unlockCouponId
    ? coupons.find((c) => c.id === form.unlockCouponId)
    : undefined
  const currentCouponIncompatible =
    !!currentCoupon && (currentCoupon.targetType !== "INDIVIDUAL" || !currentCoupon.isActive)
  const couponOptions = currentCouponIncompatible ? [currentCoupon, ...eligibleCoupons] : eligibleCoupons

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Cart Milestone" : "Create Cart Milestone"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cm-name">Milestone Name *</Label>
            <Input
              id="cm-name"
              placeholder="e.g. Spend ₹500, get ₹50 off"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cm-min">Minimum Order Amount *</Label>
            <Input
              id="cm-min"
              type="number"
              min={0}
              value={form.minOrderAmount ?? ""}
              onChange={(e) => setForm({ ...form, minOrderAmount: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Reward Type *</Label>
              <Select
                value={form.rewardType}
                onValueChange={(v) => setForm({ ...form, rewardType: v as CartMilestoneRewardType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(REWARD_TYPE_LABELS) as CartMilestoneRewardType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {REWARD_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showRewardValue && (
              <div className="space-y-1.5">
                <Label htmlFor="cm-value">Reward Value *</Label>
                <Input
                  id="cm-value"
                  type="number"
                  min={0}
                  value={form.rewardValue ?? ""}
                  onChange={(e) => setForm({ ...form, rewardValue: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            )}
          </div>

          {showCouponPicker && (
            <div className="space-y-1.5">
              <Label>Coupon to Unlock *</Label>
              <Select
                value={form.unlockCouponId ?? ""}
                onValueChange={(v) => setForm({ ...form, unlockCouponId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a coupon..." />
                </SelectTrigger>
                <SelectContent>
                  {couponOptions.map((c) => (
                    <SelectItem key={c!.id} value={c!.id}>
                      {c!.code}
                      {(c!.targetType !== "INDIVIDUAL" || !c!.isActive) && " ⚠️ won't work as-is"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentCouponIncompatible ? (
                <p className="text-xs text-destructive">
                  &quot;{currentCoupon?.code}&quot; has Target Audience &quot;{currentCoupon?.targetType}
                  &quot;{!currentCoupon?.isActive ? " and is inactive" : ""} — pick a different coupon, or
                  go to Coupons and set its Target Audience to &quot;Specific customers&quot;
                  {!currentCoupon?.isActive ? " and reactivate it" : ""} to keep using this one.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Only active coupons with Target Audience &quot;Specific customers&quot; can be unlocked
                  this way — that&apos;s the only audience setting an unlock actually takes effect on.
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="cm-before">Message Before Unlock</Label>
            <Input
              id="cm-before"
              placeholder="Add ₹{amount} more to unlock {name}"
              value={form.messageBefore ?? ""}
              onChange={(e) => setForm({ ...form, messageBefore: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Use <code>{"{amount}"}</code> and <code>{"{name}"}</code> as placeholders.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cm-after">Message After Unlock</Label>
            <Input
              id="cm-after"
              placeholder="Reward unlocked!"
              value={form.messageAfter ?? ""}
              onChange={(e) => setForm({ ...form, messageAfter: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Applicable To</Label>
              <Select
                value={form.applicableUserType}
                onValueChange={(v) => setForm({ ...form, applicableUserType: v as CartMilestoneUserType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(USER_TYPE_LABELS) as CartMilestoneUserType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {USER_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.applicableUserType === "SEGMENT" && (
              <div className="space-y-1.5">
                <Label>Segment</Label>
                <Select
                  value={form.applicableSegmentId ?? ""}
                  onValueChange={(v) => setForm({ ...form, applicableSegmentId: v })}
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
            <Label htmlFor="cm-usage-limit">Per-User Redemption Limit</Label>
            <Input
              id="cm-usage-limit"
              type="number"
              min={1}
              placeholder="Unlimited"
              value={form.usageLimitPerUser ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  usageLimitPerUser: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              How many times the same customer can earn this milestone&apos;s reward. Leave blank for
              unlimited (every qualifying order).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={form.stackableWithCoupon}
              onCheckedChange={(v) => setForm({ ...form, stackableWithCoupon: v })}
            />
            <Label>Stackable with coupons</Label>
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
