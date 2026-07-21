"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useVendorDetails } from "@/hooks/useVendorDetail"
import { useReviewVendorApplication } from "@/hooks/useVendorApplications"

// Leaflet touches `window` at import time, so it can only run in the browser.
const VendorRadiusMap = dynamic(
  () => import("@/components/vendor-applications/VendorRadiusMap").then((m) => m.VendorRadiusMap),
  { ssr: false, loading: () => <div className="h-[320px] rounded-xl bg-[#fafafd] border border-[#e8e8ef] animate-pulse" /> }
)

export default function RadiusApprovalPage() {
  const params = useParams()
  const router = useRouter()
  const appId = params.applicationId as string
  const { data: application, isLoading } = useVendorDetails(appId)
  const reviewApplication = useReviewVendorApplication()

  // Postgres NUMERIC columns arrive over the API as strings (e.g. "5.00"),
  // so these must be coerced to Number before any arithmetic — otherwise
  // the +/- handlers below silently do string concatenation instead of math.
  const requestedRadius = Number(application?.requested_service_radius_km ?? application?.delivery_radius_km ?? 5)
  const [approvedRadius, setApprovedRadius] = useState<number | null>(null);

  // Seed the editable approved-radius value once the real application loads,
  // defaulting to whatever was requested.
  useEffect(() => {
    if (application && approvedRadius === null) {
      setApprovedRadius(Number(application.approved_service_radius_km ?? requestedRadius))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application])

  function handleSave() {
    if (approvedRadius == null) return
    reviewApplication.mutate(
      { id: appId, payload: { status: "APPROVED", approvedRadius } },
      { onSuccess: () => router.push(`/vendor-applications/${appId}`) }
    )
  }

  if (isLoading || !application || approvedRadius === null) {
    return <div className="text-sm text-muted-foreground py-8">Loading application…</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={`/vendor-applications/${appId}`} className="text-[13px] text-[#6366F1] hover:text-[#4F46E5] font-medium">
            &larr; Back to application
          </Link>
          <h1 className="text-[28px] font-bold tracking-tight text-[#080f14] mt-2">Radius approval</h1>
          <p className="text-[13px] text-[#7e8998] mt-0.5">{application.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/vendor-applications/${appId}`)}
            className="border-[#6366F1] text-[#6366F1] hover:bg-[#EEF2FF] font-bold rounded-full h-10 px-5 text-[13px]"
          >
            Back to application
          </Button>
          <Button
            onClick={handleSave}
            disabled={reviewApplication.isPending}
            className="bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white font-bold rounded-full h-10 px-5 text-[13px] shadow-[0_4px_14px_rgba(6,182,212,0.25)]"
          >
            {reviewApplication.isPending ? "Saving…" : "Save approved radius"}
          </Button>
        </div>
      </div>

      {/* Main Grid — no live map (Maps SDK isn't configured in this environment); show the real coordinates as text instead. */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="lndry-card space-y-3">
          <h2 className="text-[15px] font-bold text-[#080f14]">Location</h2>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between"><span className="text-[#7e8998]">Address</span><span className="text-[#080f14] font-medium">{[application.address_line1, application.city, application.pincode].filter(Boolean).join(", ") || "—"}</span></div>
            <div className="flex justify-between"><span className="text-[#7e8998]">Latitude</span><span className="text-[#080f14] font-medium">{application.lat ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-[#7e8998]">Longitude</span><span className="text-[#080f14] font-medium">{application.lng ?? "—"}</span></div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Service radius decision */}
          <div className="lndry-card">
            <h2 className="text-[15px] font-bold text-[#080f14] mb-3">Service radius decision</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-[13px] border-b border-[#f4f4f8] pb-2">
                <span className="text-[#7e8998]">Requested radius</span>
                <span className="text-red-500 font-bold">{requestedRadius.toFixed(2)} km</span>
              </div>
              <div className="pt-2">
                <span className="text-[12px] text-[#7e8998]">Approved radius</span>
                <div className="flex items-center justify-between mt-2 gap-3">
                  <div className="flex items-baseline gap-1.5">
                    <input
                      type="number"
                      inputMode="decimal"
                      step={0.5}
                      min={1}
                      max={25}
                      value={approvedRadius}
                      onChange={(e) => {
                        const parsed = parseFloat(e.target.value)
                        if (Number.isNaN(parsed)) return
                        setApprovedRadius(Math.min(25, Math.max(1, parsed)))
                      }}
                      onBlur={() => setApprovedRadius((r) => Math.round(Number(r ?? requestedRadius) * 2) / 2)}
                      className="text-[36px] font-bold text-[#047857] w-24 bg-transparent border-b-2 border-[#e8e8ef] focus:border-[#047857] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[15px] font-semibold text-[#047857]">km</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setApprovedRadius((r) => Math.max(1, Number(r ?? requestedRadius) - 0.5))}
                      className="w-8 h-8 rounded-full border border-[#e8e8ef] flex items-center justify-center hover:bg-[#fafafd] text-[#334155] font-bold"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setApprovedRadius((r) => Math.min(25, Number(r ?? requestedRadius) + 0.5))}
                      className="w-8 h-8 rounded-full border border-[#e8e8ef] flex items-center justify-center hover:bg-[#fafafd] text-[#334155] font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-[#7e8998] mt-1">Type an exact value, or use +/- to step by 0.5 km.</p>
              </div>
            </div>
            <p className="text-[11px] text-[#7e8998] mt-2">Customers outside the approved boundary will not see this vendor as eligible.</p>
          </div>
        </div>
      </div>

      {/* Coverage map — shows the pinned shop location and the approved radius as a real-world-accurate circle */}
      <div className="lndry-card">
        <h2 className="text-[15px] font-bold text-[#080f14] mb-1">Coverage preview</h2>
        <p className="text-[12px] text-[#7e8998] mb-4">
          The shaded circle is the actual area this radius will cover — it updates live as you adjust the radius above.
        </p>
        {application.lat != null && application.lng != null ? (
          <VendorRadiusMap lat={Number(application.lat)} lng={Number(application.lng)} radiusKm={approvedRadius} />
        ) : (
          <div className="h-[320px] rounded-xl bg-[#fafafd] border border-[#e8e8ef] flex items-center justify-center">
            <p className="text-[13px] text-[#7e8998]">No pinned location on this application yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
