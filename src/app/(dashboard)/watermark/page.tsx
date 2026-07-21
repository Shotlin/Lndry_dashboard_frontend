"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Loader2,
  Save,
  Image as ImageIcon,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { PageHeader } from "@/components/shared/PageHeader"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  getWatermarkSettings,
  updateWatermarkSettings,
  getWatermarkJobs,
  createWatermarkJob,
  type WatermarkJob,
} from "@/services/watermark.service"

const settingsSchema = z.object({
  enabled: z.boolean(),
  text: z.string().min(3, "Text must be at least 3 characters").max(100, "Text must be under 100 characters"),
  position: z.string().min(1, "Position is required"),
  scale: z.coerce.number().min(0.1).max(10),
  opacity: z.coerce.number().min(0.01).max(1),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export default function WatermarkPage() {
  const [jobs, setJobs] = useState<WatermarkJob[]>([])
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [submittingSettings, setSubmittingSettings] = useState(false)
  const [submittingJob, setSubmittingJob] = useState(false)
  const [assetIdInput, setAssetIdInput] = useState("")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      enabled: true,
      text: "LNDRY Verification Only",
      position: "center",
      scale: 1.0,
      opacity: 0.4,
    },
  })

  const isEnabled = watch("enabled")

  // Load settings on mount
  useEffect(() => {
    getWatermarkSettings()
      .then((res) => {
        setValue("enabled", res.enabled)
        setValue("text", res.text)
        setValue("position", res.position || "center")
        setValue("scale", res.scale || 1.0)
        setValue("opacity", res.opacity || 0.4)
        setLoadingSettings(false)
      })
      .catch(() => {
        toast.error("Failed to load watermark settings")
        setLoadingSettings(false)
      })
  }, [setValue])

  // Load jobs and set up polling
  const fetchJobs = () => {
    getWatermarkJobs()
      .then((res) => {
        setJobs(res)
        setLoadingJobs(false)
      })
      .catch(() => {
        setLoadingJobs(false)
      })
  }

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(() => {
      // Poll only if there are pending/processing jobs
      const hasActiveJobs = jobs.some((j) => j.status === "PENDING" || j.status === "PROCESSING")
      if (hasActiveJobs || jobs.length === 0) {
        fetchJobs()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [jobs])

  const onSubmitSettings = async (values: any) => {
    setSubmittingSettings(true)
    try {
      await updateWatermarkSettings(values)
      toast.success("Watermark settings saved successfully.")
    } catch {
      toast.error("Failed to save watermark settings")
    } finally {
      setSubmittingSettings(false)
    }
  }

  const handleQueueJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assetIdInput.trim()) {
      toast.error("Please enter a valid Application or Asset ID")
      return
    }

    setSubmittingJob(true)
    try {
      await createWatermarkJob(assetIdInput.trim())
      toast.success("Batch watermark job scheduled successfully")
      setAssetIdInput("")
      fetchJobs()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to schedule job")
    } finally {
      setSubmittingJob(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <PageHeader
        title="KYC Watermark Management"
        subtitle="Secure uploaded documents with dynamic watermarks and run batch overlay jobs"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-1">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-brand-500" />
                Overlay Configurations
              </CardTitle>
              <CardDescription>Global dynamic image watermark properties</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSettings ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmitSettings)} className="space-y-4">
                  {/* Enable Switch */}
                  <div className="flex items-center justify-between pb-3 border-b border-border/80">
                    <div className="space-y-0.5">
                      <Label htmlFor="enabled" className="text-sm font-semibold">
                        Enable Watermark
                      </Label>
                      <p className="text-xs text-muted-foreground">Apply overlay on document reviews</p>
                    </div>
                    <Switch
                      id="enabled"
                      checked={isEnabled}
                      onCheckedChange={(checked) => setValue("enabled", checked)}
                    />
                  </div>

                  {/* Watermark Text */}
                  <div className="space-y-1">
                    <Label htmlFor="text" className="text-xs font-semibold">Watermark Text</Label>
                    <Input
                      id="text"
                      className="bg-background text-foreground"
                      disabled={!isEnabled}
                      {...register("text")}
                    />
                    {errors.text && (
                      <p className="text-[11px] text-danger">{errors.text.message?.toString()}</p>
                    )}
                  </div>

                  {/* Position */}
                  <div className="space-y-1">
                    <Label htmlFor="position" className="text-xs font-semibold">Position Mode</Label>
                    <select
                      id="position"
                      disabled={!isEnabled}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none disabled:opacity-50"
                      {...register("position")}
                    >
                      <option value="center">Center Overlay</option>
                      <option value="repeat">Tiled Pattern (Repeat)</option>
                    </select>
                    {errors.position && (
                      <p className="text-[11px] text-danger">{errors.position.message?.toString()}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Scale */}
                    <div className="space-y-1">
                      <Label htmlFor="scale" className="text-xs font-semibold">Scale multiplier</Label>
                      <Input
                        id="scale"
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10"
                        className="bg-background text-foreground"
                        disabled={!isEnabled}
                        {...register("scale")}
                      />
                      {errors.scale && (
                        <p className="text-[11px] text-danger">{errors.scale.message?.toString()}</p>
                      )}
                    </div>

                    {/* Opacity */}
                    <div className="space-y-1">
                      <Label htmlFor="opacity" className="text-xs font-semibold">Opacity (0-1)</Label>
                      <Input
                        id="opacity"
                        type="number"
                        step="0.05"
                        min="0.01"
                        max="1"
                        className="bg-background text-foreground"
                        disabled={!isEnabled}
                        {...register("opacity")}
                      />
                      {errors.opacity && (
                        <p className="text-[11px] text-danger">{errors.opacity.message?.toString()}</p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium gap-1.5"
                    disabled={submittingSettings}
                  >
                    {submittingSettings ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Configurations
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Jobs List Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Job Card */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Run Batch Watermark Reprocessing</CardTitle>
              <CardDescription>
                Schedule watermark overlay rendering for older KYC documents and assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQueueJob} className="flex gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="assetId" className="text-xs font-semibold">
                    Vendor Application ID / Asset ID
                  </Label>
                  <Input
                    id="assetId"
                    placeholder="Enter UUID of application or file..."
                    value={assetIdInput}
                    onChange={(e) => setAssetIdInput(e.target.value)}
                    className="bg-background text-foreground"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submittingJob}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-medium gap-1.5 shrink-0 h-9"
                >
                  {submittingJob ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Queue Job
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Jobs Table */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Reprocessing Jobs Queue</CardTitle>
                <CardDescription>Real-time updates on background worker processes</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={fetchJobs} className="h-8 w-8 text-muted-foreground">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingJobs ? (
                <div className="flex h-36 items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Job ID</TableHead>
                        <TableHead>Target ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No watermark reprocessing jobs found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        jobs.map((job) => (
                          <TableRow key={job.id} className="hover:bg-muted/10">
                            <TableCell className="font-mono text-xs max-w-[120px] truncate">
                              {job.id}
                            </TableCell>
                            <TableCell className="text-xs font-mono max-w-[150px] truncate">
                              {job.asset_id}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-[10px] border-0 px-2 py-0.5 font-medium flex items-center w-fit gap-1 ${
                                  job.status === "COMPLETED"
                                    ? "bg-success-bg text-success"
                                    : job.status === "PROCESSING"
                                    ? "bg-info-bg text-info animate-pulse"
                                    : job.status === "FAILED"
                                    ? "bg-danger-bg text-danger"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {job.status === "COMPLETED" && <CheckCircle className="h-3 w-3" />}
                                {job.status === "FAILED" && <XCircle className="h-3 w-3" />}
                                {job.status === "PROCESSING" && <Loader2 className="h-3 w-3 animate-spin" />}
                                {job.status === "PENDING" && <AlertTriangle className="h-3 w-3" />}
                                {job.status}
                              </Badge>
                              {job.status === "FAILED" && job.error_message && (
                                <p className="text-[10px] text-danger mt-1 font-sans">{job.error_message}</p>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(job.created_at).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
