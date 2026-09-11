"use client"

/**
 * Rider Assignment settings — Phase 5 of the rider-assignment initiative
 * (see CLAUDE.md). Right now this is a single tunable: how long a
 * broadcast job offer stays open before the system automatically
 * re-broadcasts it to whoever's active. Room to grow here later
 * (assignment algorithm choice, etc.) as the initiative's later phases
 * land — same "admin sets a rule, takes effect immediately" pattern as
 * the Fees page.
 */

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Radio, Save } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/shared/PageHeader"
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
import { riderAssignmentSettingsService } from "@/services/rider-assignment-settings.service"
import type { RiderAssignmentSettings } from "@/types/rider-assignment-settings.types"

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

export default function RiderAssignmentSettingsPage() {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<RiderAssignmentSettings | null>(null)

  const { data: config, isLoading } = useQuery({
    queryKey: ["admin", "rider-assignment-settings"],
    queryFn: riderAssignmentSettingsService.get,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (config) setDraft(config)
  }, [config])

  const updateMutation = useMutation({
    mutationFn: riderAssignmentSettingsService.update,
    onSuccess: () => {
      toast.success("Rider assignment settings saved")
      queryClient.invalidateQueries({ queryKey: ["admin", "rider-assignment-settings"] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  function handleSave() {
    if (!draft) return
    if (!Number.isFinite(draft.broadcast_timeout_minutes) || draft.broadcast_timeout_minutes < 1) {
      toast.error("Timeout must be at least 1 minute")
      return
    }
    if (draft.broadcast_timeout_minutes > 1440) {
      toast.error("Timeout can't exceed 24 hours (1440 minutes)")
      return
    }
    updateMutation.mutate({ broadcast_timeout_minutes: draft.broadcast_timeout_minutes })
  }

  if (isLoading || !draft) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Rider Assignment"
          subtitle="Configure how job offers are broadcast and retried."
        />
        <Card className="max-w-xl">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rider Assignment"
        subtitle="Configure how job offers are broadcast and retried. Changes apply to new offers only."
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

      <Card className="max-w-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Broadcast Timeout</CardTitle>
              <CardDescription>
                When a vendor broadcasts a job to every active rider, this is
                how long it stays open before the system automatically
                re-broadcasts it — repeating until someone accepts.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="broadcast-timeout">Timeout</Label>
            <div className="relative max-w-[200px]">
              <Input
                id="broadcast-timeout"
                type="number"
                inputMode="numeric"
                min={1}
                max={1440}
                value={draft.broadcast_timeout_minutes}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    broadcast_timeout_minutes: Number(e.target.value) || 0,
                  })
                }
                className="pr-16"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                minutes
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Applies platform-wide, to every vendor's broadcasts. Doesn't
            affect a manually assigned order — only ones sent to "all active
            riders."
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
