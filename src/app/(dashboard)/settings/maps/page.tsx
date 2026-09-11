"use client"

import { useEffect, useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"

import { olaMapsSettingsService } from "@/services/ola-maps-settings.service"
import { usePermissions } from "@/hooks/usePermissions"
import type { OlaMapsTestResult } from "@/types/ola-maps-settings.types"

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response
    if (response?.data?.message) return response.data.message
  }
  if (error instanceof Error) return error.message
  return "Something went wrong"
}

export default function OlaMapsSettingsPage() {
  const { can } = usePermissions()
  const canManage = can("settings.manage")
  const queryClient = useQueryClient()

  const [draftKey, setDraftKey] = useState("")
  const [enabled, setEnabled] = useState(false)
  const [lastTestResult, setLastTestResult] = useState<OlaMapsTestResult | null>(
    null,
  )

  const { data: settings, isLoading } = useQuery({
    queryKey: ["ola-maps-settings"],
    queryFn: olaMapsSettingsService.get,
  })

  useEffect(() => {
    if (settings) setEnabled(settings.isEnabled)
  }, [settings])

  const testMutation = useMutation({
    mutationFn: () => olaMapsSettingsService.test(draftKey),
    onSuccess: (result) => {
      setLastTestResult(result)
      if (result.success) {
        toast.success(`Connected (HTTP ${result.statusCode})`)
      } else {
        toast.error(result.message)
      }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      olaMapsSettingsService.save({
        apiKey: draftKey ? draftKey : undefined,
        isEnabled: enabled,
      }),
    onSuccess: ({ testResult }) => {
      queryClient.invalidateQueries({ queryKey: ["ola-maps-settings"] })
      setDraftKey("")
      setLastTestResult(testResult)
      if (!testResult.success && enabled) {
        toast.warning(
          "Saved, but the key failed its connection test — Ola Maps stays disabled.",
        )
      } else {
        toast.success("Ola Maps settings saved")
      }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const testDisabled = !canManage || !draftKey.trim() || testMutation.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maps"
        subtitle="Configure the Ola Maps integration used for address search, current-location detection, and pickup/delivery maps."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ola Maps</CardTitle>
              <CardDescription>
                Vector map + geocoding provider for the customer app&apos;s
                location flow.
              </CardDescription>
            </div>
            {settings?.lastTestStatus && (
              <Badge variant={settings.lastTestStatus === "SUCCESS" ? "default" : "destructive"}>
                {settings.lastTestStatus === "SUCCESS"
                  ? "Last test passed"
                  : "Last test failed"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Customer app calls fall back to the phone&apos;s own OS
                    geocoder whenever this is off or not configured.
                  </p>
                </div>
                <Switch
                  checked={enabled}
                  disabled={!canManage || !settings?.configured}
                  onCheckedChange={setEnabled}
                />
              </div>

              {settings?.configured && (
                <div className="text-sm text-muted-foreground">
                  Current key:{" "}
                  <span className="font-mono">{settings.maskedKey}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="ola-maps-key">
                  {settings?.configured ? "Replace API key" : "API key"}
                </Label>
                <Input
                  id="ola-maps-key"
                  type="password"
                  placeholder="Paste the Ola Maps API key"
                  value={draftKey}
                  disabled={!canManage}
                  onChange={(e) => {
                    setDraftKey(e.target.value)
                    setLastTestResult(null)
                  }}
                />
              </div>

              {lastTestResult && (
                <div
                  className={`rounded-lg border p-3 text-sm ${
                    lastTestResult.success
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-red-200 bg-red-50 text-red-800"
                  }`}
                >
                  {lastTestResult.message}
                  {lastTestResult.statusCode != null &&
                    ` (HTTP ${lastTestResult.statusCode})`}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  disabled={testDisabled}
                  onClick={() => testMutation.mutate()}
                >
                  {testMutation.isPending ? "Testing..." : "Test Connection"}
                </Button>
                <Button
                  disabled={!canManage || saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                >
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
