"use client"

import { useEffect, useState } from "react"
import { ExternalLink, Star, Unlink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useSetGoogleBusiness } from "@/hooks/useVendorDetail"
import type { Vendor } from "@/services/vendors.service"

/**
 * Optional Google Business Profile connection for a vendor — a trust
 * signal shown alongside (never instead of) the existing LNDRY reviews.
 * Deliberately admin-typed, not scraped/API-resolved: paste the vendor's
 * public Google Maps/Business link, then type in the rating and review
 * count you see on their actual Google listing. Leaving the link blank
 * and saving removes the whole connection — no link means no Google card
 * in the customer app, ever.
 */
export function GoogleBusinessControl({ vendorId, vendor }: { vendorId: string; vendor: Vendor }) {
  const [url, setUrl] = useState(vendor.google_business_url ?? "")
  const [rating, setRating] = useState(vendor.google_rating != null ? String(vendor.google_rating) : "")
  const [reviewCount, setReviewCount] = useState(
    vendor.google_review_count != null ? String(vendor.google_review_count) : ""
  )
  const [businessName, setBusinessName] = useState(vendor.google_business_name ?? "")
  const setGoogle = useSetGoogleBusiness(vendorId)

  // Keep the fields in sync with the vendor's saved values (e.g. after a
  // successful save invalidates and refetches the detail query).
  useEffect(() => {
    setUrl(vendor.google_business_url ?? "")
    setRating(vendor.google_rating != null ? String(vendor.google_rating) : "")
    setReviewCount(vendor.google_review_count != null ? String(vendor.google_review_count) : "")
    setBusinessName(vendor.google_business_name ?? "")
  }, [vendor.google_business_url, vendor.google_rating, vendor.google_review_count, vendor.google_business_name])

  const dirty =
    url.trim() !== (vendor.google_business_url ?? "") ||
    rating.trim() !== (vendor.google_rating != null ? String(vendor.google_rating) : "") ||
    reviewCount.trim() !== (vendor.google_review_count != null ? String(vendor.google_review_count) : "") ||
    businessName.trim() !== (vendor.google_business_name ?? "")

  const savedRating = vendor.google_rating != null ? Number(vendor.google_rating) : null
  const isConnected = !!vendor.google_business_url && savedRating != null

  const handleSave = () => {
    setGoogle.mutate({
      url: url.trim(),
      rating: rating.trim() ? Number(rating.trim()) : null,
      reviewCount: reviewCount.trim() ? Number(reviewCount.trim()) : null,
      businessName: businessName.trim() || null,
    })
  }

  const handleRemove = () => {
    setUrl("")
    setRating("")
    setReviewCount("")
    setBusinessName("")
    setGoogle.mutate({ url: "" })
  }

  return (
    <div className="space-y-2 rounded-xl border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Star className="h-3.5 w-3.5 text-brand-500" />
        <span className="text-xs font-semibold text-foreground">Google Business Profile</span>
        {isConnected ? (
          <Badge className="bg-success-bg text-success border-0 gap-1">
            <Star className="h-3 w-3 fill-current" />
            {savedRating!.toFixed(1)} · {vendor.google_review_count ?? 0} reviews
          </Badge>
        ) : vendor.google_business_url ? (
          <Badge className="bg-warning-bg text-warning border-0">Saved — no rating entered yet</Badge>
        ) : (
          <Badge className="bg-muted text-muted-foreground border-0">Not connected</Badge>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste the vendor's Google Maps / Business link"
          className="h-8 text-xs sm:col-span-2"
          disabled={setGoogle.isPending}
        />
        <Input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Business name shown on Google (optional)"
          className="h-8 text-xs sm:col-span-2"
          disabled={setGoogle.isPending}
        />
        <Input
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          placeholder="Rating, e.g. 4.7"
          type="number"
          min={0}
          max={5}
          step={0.1}
          className="h-8 text-xs"
          disabled={setGoogle.isPending}
        />
        <Input
          value={reviewCount}
          onChange={(e) => setReviewCount(e.target.value)}
          placeholder="Review count, e.g. 326"
          type="number"
          min={0}
          step={1}
          className="h-8 text-xs"
          disabled={setGoogle.isPending}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" className="h-8 text-xs" disabled={!dirty || setGoogle.isPending} onClick={handleSave}>
          Save
        </Button>
        {isConnected && (
          <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs" asChild>
            <a href={vendor.google_business_url ?? "#"} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
              View on Google
            </a>
          </Button>
        )}
        {vendor.google_business_url && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1 text-xs text-danger"
            disabled={setGoogle.isPending}
            onClick={handleRemove}
          >
            <Unlink className="h-3 w-3" />
            Remove
          </Button>
        )}
      </div>
      <p className="text-[11px] leading-snug text-muted-foreground">
        Optional — leave blank if this vendor has no Google Business listing. Type in the rating and review count
        you see on their actual Google page; update them here whenever they change. Nothing is shown in the
        customer app, and no number is ever made up, while it isn&apos;t connected.
      </p>
    </div>
  )
}
