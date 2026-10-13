"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AlertTriangle, Check, Copy, FlaskConical, Radio } from "lucide-react"

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

import { razorpaySettingsService } from "@/services/razorpay-settings.service"
import { usePermissions } from "@/hooks/usePermissions"
import { cn } from "@/lib/utils"
import type {
  ConnectionTestResult,
  RazorpayMode,
  RazorpayModeSettings,
  RazorpaySettings,
} from "@/types/integration-settings.types"

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response
    if (response?.data?.message) return response.data.message
  }
  if (error instanceof Error) return error.message
  return "Something went wrong"
}

const QUERY_KEY = ["razorpay-settings"]

export default function RazorpaySettingsPage() {
  const { can } = usePermissions()
  const canManage = can("settings.write")
  const queryClient = useQueryClient()
  const [switchTo, setSwitchTo] = useState<RazorpayMode | null>(null)
  const [confirmText, setConfirmText] = useState("")
  const [copied, setCopied] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: razorpaySettingsService.get,
  })

  const refresh = (next?: RazorpaySettings) => {
    if (next) queryClient.setQueryData(QUERY_KEY, next)
    queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }

  const switchMutation = useMutation({
    mutationFn: (mode: RazorpayMode) => razorpaySettingsService.setActiveMode(mode),
    onSuccess: ({ settings: next, warnings }, mode) => {
      refresh(next)
      toast.success(`Razorpay is now in ${mode} mode`)
      warnings.forEach((w) => toast.warning(w))
      setSwitchTo(null)
      setConfirmText("")
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const copyWebhook = async () => {
    if (!settings) return
    try {
      await navigator.clipboard.writeText(settings.webhookUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Could not copy — select the link and copy it manually")
    }
  }

  const requestSwitch = (mode: RazorpayMode) => {
    if (!settings || mode === settings.activeMode) return
    setConfirmText("")
    setSwitchTo(mode)
  }

  const liveSwitch = switchTo === "LIVE"
  const confirmOk = !liveSwitch || confirmText.trim().toUpperCase() === "LIVE"

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments (Razorpay)"
        subtitle="Save your Razorpay Test and Live keys separately, test each one, then switch which one the apps use. Takes effect within a few seconds — no redeploy."
      />

      {isLoading || !settings ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Active mode</CardTitle>
              <CardDescription>
                {settings.effective.source === "env"
                  ? "No keys saved here yet — payments currently use the server's built-in keys."
                  : settings.effective.source === "none"
                    ? "Payments are not configured."
                    : `Customers and captains are paying through Razorpay ${settings.effective.mode} mode (${settings.effective.keyId}).`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                role="group"
                aria-label="Razorpay mode"
                className="inline-flex rounded-lg border p-1"
              >
                <ModeButton
                  label="Test"
                  hint="No real money"
                  icon={<FlaskConical className="size-4" />}
                  active={settings.activeMode === "TEST"}
                  tone="test"
                  disabled={!canManage || switchMutation.isPending}
                  onClick={() => requestSwitch("TEST")}
                />
                <ModeButton
                  label="Live"
                  hint="Real money"
                  icon={<Radio className="size-4" />}
                  active={settings.activeMode === "LIVE"}
                  tone="live"
                  disabled={!canManage || switchMutation.isPending}
                  onClick={() => requestSwitch("LIVE")}
                />
              </div>

              {settings.pendingPayments > 0 && (
                <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  {settings.pendingPayments} payment(s) are waiting to be
                  completed right now. Switching mode makes those customers&apos;
                  payments fail verification — switch when it is quiet.
                </p>
              )}

              <div className="space-y-1.5">
                <Label>Webhook URL (paste this in Razorpay → Webhooks)</Label>
                <div className="flex gap-2">
                  <Input readOnly value={settings.webhookUrl} className="font-mono text-xs" />
                  <Button type="button" variant="outline" onClick={copyWebhook}>
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use the same URL for Test and Live in Razorpay, with each mode&apos;s
                  own webhook secret saved below. Events to enable: payment.captured,
                  payment.failed, refund.processed.
                </p>
              </div>
            </CardContent>
          </Card>

          <KeysCard
            mode="TEST"
            side={settings.test}
            isActive={settings.activeMode === "TEST"}
            canManage={canManage}
            onChanged={refresh}
          />
          <KeysCard
            mode="LIVE"
            side={settings.live}
            isActive={settings.activeMode === "LIVE"}
            canManage={canManage}
            onChanged={refresh}
          />
        </>
      )}

      <Dialog open={switchTo !== null} onOpenChange={(o) => !o && setSwitchTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Switch to {liveSwitch ? "LIVE (real money)" : "TEST"} mode?
            </DialogTitle>
            <DialogDescription>
              {liveSwitch
                ? "From now on, every payment, wallet top-up and refund moves real money. The saved Live keys are checked with Razorpay first."
                : "From now on, payments use test keys — no real money moves, and real customers cannot pay for real."}
            </DialogDescription>
          </DialogHeader>
          {liveSwitch && (
            <div className="space-y-2">
              <Label htmlFor="confirm-live">Type LIVE to confirm</Label>
              <Input
                id="confirm-live"
                autoComplete="off"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwitchTo(null)}>
              Cancel
            </Button>
            <Button
              variant={liveSwitch ? "destructive" : "default"}
              disabled={!confirmOk || switchMutation.isPending}
              onClick={() => switchTo && switchMutation.mutate(switchTo)}
            >
              {switchMutation.isPending ? "Checking & switching..." : `Switch to ${switchTo}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ModeButton(props: {
  label: string
  hint: string
  icon: React.ReactNode
  active: boolean
  tone: "test" | "live"
  disabled: boolean
  onClick: () => void
}) {
  const { label, hint, icon, active, tone, disabled, onClick } = props
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-w-40 items-center gap-2 rounded-md px-4 py-2 text-left text-sm transition-colors disabled:opacity-60",
        active && tone === "test" && "bg-blue-600 text-white",
        active && tone === "live" && "bg-red-600 text-white",
        !active && "text-muted-foreground hover:bg-muted",
      )}
    >
      {icon}
      <span>
        <span className="block font-medium leading-tight">{label}</span>
        <span className="block text-xs opacity-80">{hint}</span>
      </span>
    </button>
  )
}

function KeysCard(props: {
  mode: RazorpayMode
  side: RazorpayModeSettings
  isActive: boolean
  canManage: boolean
  onChanged: (next?: RazorpaySettings) => void
}) {
  const { mode, side, isActive, canManage, onChanged } = props
  const isLive = mode === "LIVE"
  const [keyId, setKeyId] = useState("")
  const [keySecret, setKeySecret] = useState("")
  const [webhookSecret, setWebhookSecret] = useState("")
  const [result, setResult] = useState<ConnectionTestResult | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const anyTyped = Boolean(keyId.trim() || keySecret.trim() || webhookSecret.trim())
  const prefix = isLive ? "rzp_live_" : "rzp_test_"

  const testMutation = useMutation({
    mutationFn: () =>
      razorpaySettingsService.test(mode, {
        keyId: keyId.trim() || undefined,
        keySecret: keySecret.trim() || undefined,
      }),
    onSuccess: (r) => {
      setResult(r)
      if (r.success) toast.success(r.message)
      else toast.error(r.message)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      razorpaySettingsService.save(mode, {
        ...(keyId.trim() ? { keyId: keyId.trim() } : {}),
        ...(keySecret.trim() ? { keySecret: keySecret.trim() } : {}),
        ...(webhookSecret.trim() ? { webhookSecret: webhookSecret.trim() } : {}),
      }),
    onSuccess: ({ settings, testResult, takesEffectNow }) => {
      onChanged(settings)
      setKeyId("")
      setKeySecret("")
      setWebhookSecret("")
      setResult(testResult)
      toast.success(
        takesEffectNow
          ? `${mode} keys saved — in use right now`
          : `${mode} keys saved`,
      )
    },
    onError: (error) => {
      setResult({ success: false, message: getErrorMessage(error) })
      toast.error(getErrorMessage(error))
    },
  })

  const removeMutation = useMutation({
    mutationFn: () => razorpaySettingsService.remove(mode),
    onSuccess: ({ settings }) => {
      onChanged(settings)
      setConfirmRemove(false)
      setResult(null)
      toast.success(`${mode} keys removed`)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const canTest = canManage && !testMutation.isPending && (anyTyped || side.configured)

  return (
    <Card className={cn(isLive && "border-red-200")}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isLive ? "Live keys" : "Test keys"}
              {isActive && <Badge>In use now</Badge>}
            </CardTitle>
            <CardDescription>
              {isLive
                ? "Real money. From Razorpay → Account & Settings → API Keys, with the dashboard switched to Live mode."
                : "Safe testing, no real money. From Razorpay → API Keys, with the dashboard switched to Test mode."}
            </CardDescription>
          </div>
          {side.lastTestStatus && (
            <Badge variant={side.lastTestStatus === "SUCCESS" ? "default" : "destructive"}>
              {side.lastTestStatus === "SUCCESS" ? "Last test passed" : "Last test failed"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {side.configured ? (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <div>
              Saved Key ID: <span className="font-mono">{side.keyId}</span>
            </div>
            <div>
              Saved Key Secret: <span className="font-mono">{side.maskedSecret}</span>
            </div>
            <div>
              Webhook secret:{" "}
              {side.webhookConfigured ? (
                <span className="text-green-700">saved</span>
              ) : (
                <span className="text-amber-700">not saved yet</span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No {mode.toLowerCase()} keys saved yet.</p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${mode}-key-id`}>
              {side.configured ? "Replace Key ID" : "Key ID"}
            </Label>
            <Input
              id={`${mode}-key-id`}
              autoComplete="off"
              placeholder={`${prefix}xxxxxxxxxxxx`}
              value={keyId}
              disabled={!canManage}
              onChange={(e) => {
                setKeyId(e.target.value)
                setResult(null)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${mode}-key-secret`}>
              {side.configured ? "Replace Key Secret" : "Key Secret"}
            </Label>
            <Input
              id={`${mode}-key-secret`}
              type="password"
              autoComplete="new-password"
              placeholder="Paste the Key Secret"
              value={keySecret}
              disabled={!canManage}
              onChange={(e) => {
                setKeySecret(e.target.value)
                setResult(null)
              }}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`${mode}-webhook`}>
              Webhook secret {side.configured ? "(optional)" : "(save the keys first)"}
            </Label>
            <Input
              id={`${mode}-webhook`}
              type="password"
              autoComplete="new-password"
              placeholder="The secret you typed when creating the webhook in Razorpay"
              value={webhookSecret}
              disabled={!canManage || !side.configured}
              onChange={(e) => setWebhookSecret(e.target.value)}
            />
          </div>
        </div>

        {result && (
          <div
            className={`rounded-lg border p-3 text-sm ${
              result.success
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {result.message}
          </div>
        )}
        {!result && side.lastTestMessage && (
          <p className="text-xs text-muted-foreground">
            Last test: {side.lastTestMessage}
            {side.lastTestedAt && ` (${new Date(side.lastTestedAt).toLocaleString()})`}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" disabled={!canTest} onClick={() => testMutation.mutate()}>
            {testMutation.isPending
              ? "Testing..."
              : anyTyped
                ? "Test connection"
                : "Test saved keys"}
          </Button>
          <Button
            disabled={!canManage || !anyTyped || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? "Checking & saving..." : "Save"}
          </Button>
          {side.configured && (
            <Button
              variant="ghost"
              className="text-red-600 hover:text-red-700"
              disabled={!canManage || isActive}
              title={isActive ? "Switch to the other mode before removing these keys" : undefined}
              onClick={() => setConfirmRemove(true)}
            >
              Remove keys
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Keys are checked with Razorpay before they are saved. Secrets are stored encrypted and are never shown again.
        </p>
      </CardContent>

      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove the {mode} keys?</DialogTitle>
            <DialogDescription>
              The saved {mode.toLowerCase()} Key ID, secret and webhook secret will be deleted. You can paste them again later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={removeMutation.isPending}
              onClick={() => removeMutation.mutate()}
            >
              {removeMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
