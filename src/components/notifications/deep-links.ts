import type { AudienceSpec, DeepLink, LinkType } from "@/types/notification.types"

export type TargetApp = "customer" | "partner"

export interface LinkPreset {
  value: LinkType
  label: string
  hint: string
  /** Extra value the destination needs. */
  needs?: "orderId" | "vendorId" | "route"
  apps: TargetApp[]
}

/** Destinations an admin can pick. The backend resolves each one to the right
 * screen for the person's app and role (e.g. a captain's "Order details" opens
 * their job screen). */
export const LINK_PRESETS: LinkPreset[] = [
  { value: "home", label: "Home", hint: "Opens the home screen", apps: ["customer", "partner"] },
  { value: "orders", label: "Orders", hint: "Opens the orders list", apps: ["customer", "partner"] },
  { value: "order_details", label: "Order details", hint: "Opens one specific order", needs: "orderId", apps: ["customer", "partner"] },
  { value: "vendor_details", label: "Vendor details", hint: "Opens a laundry's page", needs: "vendorId", apps: ["customer"] },
  { value: "offers", label: "Offers & coupons", hint: "Opens the offers screen", apps: ["customer"] },
  { value: "wallet", label: "Wallet", hint: "Opens the wallet", apps: ["customer"] },
  { value: "refer_earn", label: "Refer & Earn", hint: "Opens Refer & Earn", apps: ["customer"] },
  { value: "notifications", label: "Notifications", hint: "Opens the notification list", apps: ["customer", "partner"] },
  { value: "help", label: "Help & support", hint: "Opens Help & FAQs", apps: ["customer", "partner"] },
  { value: "profile", label: "Profile", hint: "Opens the profile tab", apps: ["customer", "partner"] },
  { value: "route", label: "Custom app route", hint: "An in-app path such as /profile/wallet", needs: "route", apps: ["customer", "partner"] },
]

export function presetsFor(app: TargetApp | null): LinkPreset[] {
  return app ? LINK_PRESETS.filter((p) => p.apps.includes(app)) : LINK_PRESETS
}

/** Which app an audience lives in (null = a specific person, could be either). */
export function appForAudience(spec: AudienceSpec | null): TargetApp | null {
  if (!spec) return null
  switch (spec.kind) {
    case "ALL_CUSTOMERS":
    case "SEGMENT":
      return "customer"
    case "ALL_VENDORS":
    case "ALL_CAPTAINS":
    case "VENDOR":
    case "VENDOR_CAPTAINS":
      return "partner"
    case "LOCATION":
      return spec.target === "customers" ? "customer" : "partner"
    default:
      return null
  }
}

export function linkLabel(link: DeepLink | null | undefined): string {
  if (!link?.type) return "Just open the app"
  const preset = LINK_PRESETS.find((p) => p.value === link.type)
  const extra = link.params?.orderId || link.params?.vendorId || link.params?.route
  return `${preset?.label ?? link.type}${extra ? ` · ${extra}` : ""}`
}

/** A plain-language problem with the link, or null when it is fine. */
export function linkProblem(link: DeepLink | null | undefined): string | null {
  if (!link?.type) return null
  const preset = LINK_PRESETS.find((p) => p.value === link.type)
  if (!preset?.needs) return null
  const value = (link.params?.[preset.needs] ?? "").trim()
  if (!value) {
    return preset.needs === "orderId" ? "Enter the order ID."
      : preset.needs === "vendorId" ? "Enter the vendor ID."
      : "Enter the app route."
  }
  if (preset.needs === "route" && (!value.startsWith("/") || value.startsWith("//") || value.includes("://") || value.includes(".."))) {
    return "The route must start with / and stay inside the app, e.g. /profile/wallet."
  }
  return null
}
