"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import { Switch } from "@/components/ui/switch"

import { twoFactorSettingsService } from "@/services/two-factor-settings.service"
import { usePermissions } from "@/hooks/usePermissions"
import type {
  ConnectionTestResult,
  TwoFactorSettings,
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

const QUERY_KEY = ["two-factor-settings"]

export default function TwoFactorSettingsPage() {
  const { can } = usePermissions()
  const canManage = can("settings.write")
  const queryClient = useQueryClient()

  const [apiKey, setApiKey] = useState("")
  const [template, setTemplate] = useState<string | null>(null)
  const [result, setResult] = useState<ConnectionTestResult | null>(null)
  const [testPhone, setTestPhone] = useState("")
  const [confirmRemove, setConfirmRemove] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: twoFactorSettingsService.get,
  })

  const refresh = (next?: TwoFactorSettings) => {
    if (next) queryClient.setQueryData(QUERY_KEY, next)
    queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }

  const effectiveTemplate = template ?? settings?.template ?? "LndryAppOTP"
  const templateChanged = template !== null && template !== settings?.template

  const testMutation = useMutation({
    mutationFn: () => twoFactorSettingsService.test(apiKey.trim() || undefined),
    onSuccess: (r) => {
      setResult(r)
      if (r.success) toast.success(r.message)
      else toast.error(r.message)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const saveMutation = useMutation({
    mutationFn: (payload: { apiKey?: string; template?: string; isEnabled?: boolean }) =>
      twoFactorSettingsService.save(payload),
    onSuccess: ({ settings: next, testResult }) => {
      refresh(next)
      setApiKey("")
      setTemplate(null)
      if (testResult) setResult(testResult)
      toast.success("SMS settings saved")
    },
    onError: (error) => {
      setResult({ success: false, message: getErrorMessage(error) })
      toast.error(getErrorMessage(error))
    },
  })

  const removeMutation = useMutation({
    mutationFn: () => twoFactorSettingsService.remove(),
    onSuccess: ({ settings: next }) => {
      refresh(next)
      setConfirmRemove(false)
      setResult(null)
      toast.success("2Factor key removed and SMS switched off")
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const otpMutation = useMutation({
    mutationFn: () => twoFactorSettingsService.sendTestOtp(testPhone),
    onSuccess: (r) => toast.success(`${r.message} (${r.phone})`),
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const dirty = Boolean(apiKey.trim()) || templateChanged

  return (
    <div className="space-y-6">
      <PageHeader
        title="SMS / OTP (2Factor)"
        subtitle="The 2Factor.in account that sends login OTPs to customers, vendors and captains. Takes effect within a few seconds — no redeploy."
      />

      {isLoading || !settings ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>2Factor.in</CardTitle>
                <CardDescription>
                  {settings.effective.source === "dashboard"
                    ? "Real SMS OTPs are being sent using the key saved here."
                    : settings.effective.source === "env"
                      ? "Real SMS OTPs use the server's built-in key (nothing is switched on here)."
                      : "No real SMS is being sent — only the fixed demo-OTP phone numbers can log in."}
                </CardDescription>
              </div>
              {settings.lastTestStatus && (
                <Badge variant={settings.lastTestStatus === "SUCCESS" ? "default" : "destructive"}>
                  {settings.lastTestStatus === "SUCCESS" ? "Last test passed" : "Last test failed"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Send real SMS OTPs</Label>
                <p className="text-sm text-muted-foreground">
                  {settings.configured
                    ? "Turn off to stop all real SMS (users then cannot log in unless they are demo numbers)."
                    : "Save and test an API key first."}
                </p>
              </div>
              <Switch
                checked={settings.isEnabled}
                disabled={!canManage || !settings.configured || saveMutation.isPending}
                onCheckedChange={(v) => saveMutation.mutate({ isEnabled: v })}
              />
            </div>

            {settings.configured && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <div>
                  Saved API key: <span className="font-mono">{settings.maskedKey}</span>
                </div>
                {settings.lastBalance != null && (
                  <div>SMS credits at last test: {settings.lastBalance}</div>
                )}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tf-key">
                  {settings.configured ? "Replace API key" : "API key"}
                </Label>
                <Input
                  id="tf-key"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Paste the 2Factor API key"
                  value={apiKey}
                  disabled={!canManage}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    setResult(null)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tf-template">OTP template name</Label>
                <Input
                  id="tf-template"
                  autoComplete="off"
                  value={effectiveTemplate}
                  disabled={!canManage}
                  onChange={(e) => setTemplate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Must match the SMS template name registered in your 2Factor account.
                </p>
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
            {!result && settings.lastTestMessage && (
              <p className="text-xs text-muted-foreground">
                Last test: {settings.lastTestMessage}
                {settings.lastTestedAt && ` (${new Date(settings.lastTestedAt).toLocaleString()})`}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                disabled={!canManage || testMutation.isPending || (!apiKey.trim() && !settings.configured)}
                onClick={() => testMutation.mutate()}
              >
                {testMutation.isPending
                  ? "Testing..."
                  : apiKey.trim()
                    ? "Test connection"
                    : "Test saved key"}
              </Button>
              <Button
                disabled={!canManage || !dirty || saveMutation.isPending}
                onClick={() =>
                  saveMutation.mutate({
                    ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
                    ...(templateChanged ? { template: effectiveTemplate.trim() } : {}),
                  })
                }
              >
                {saveMutation.isPending ? "Checking & saving..." : "Save"}
              </Button>
              {settings.configured && (
                <Button
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                  disabled={!canManage}
                  onClick={() => setConfirmRemove(true)}
                >
                  Remove key
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              The key is checked with 2Factor (this reads your SMS balance, it sends nothing) before it is saved. It is stored encrypted and never shown again.
            </p>
          </CardContent>
        </Card>
      )}

      {settings?.configured && (
        <Card>
          <CardHeader>
            <CardTitle>Send a test OTP</CardTitle>
            <CardDescription>
              Sends one real SMS (uses 1 credit) so you can see it arrive. It does not log anyone in.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="tf-phone">Mobile number</Label>
              <Input
                id="tf-phone"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit number"
                value={testPhone}
                disabled={!canManage || !settings.isEnabled}
                onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <Button
              disabled={!canManage || !settings.isEnabled || testPhone.length !== 10 || otpMutation.isPending}
              onClick={() => otpMutation.mutate()}
            >
              {otpMutation.isPending ? "Sending..." : "Send test OTP"}
            </Button>
            {!settings.isEnabled && (
              <p className="text-xs text-muted-foreground">Switch “Send real SMS OTPs” on first.</p>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove the 2Factor key?</DialogTitle>
            <DialogDescription>
              Real SMS OTPs stop immediately. Only the fixed demo-OTP phone numbers will be able to log in until you add a key again.
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
              {removeMutation.isPending ? "Removing..." : "Remove key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
