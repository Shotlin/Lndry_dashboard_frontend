/** Order status values matching backend remediation blueprint */
export const ORDER_STATUSES = [
  "PAYMENT_PENDING",
  "WAITING_VENDOR_CONFIRMATION",
  "VENDOR_ACCEPTED",
  "PICKUP_ASSIGNED",
  "GOING_FOR_PICKUP",
  "PICKUP_OTP_VERIFIED",
  "PICKED_UP",
  "RECEIVED_AT_VENDOR",
  "WASHING",
  "DRYING",
  "IRONING",
  "PACKED",
  "DELIVERY_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERY_OTP_VERIFIED",
  "DELIVERED",
  "PAYMENT_FAILED",
  "VENDOR_REJECTED",
  "AUTO_REJECTED",
  "CUSTOMER_CANCELLED",
  "ADMIN_CANCELLED",
  "REFUNDED",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

/** Status badge styling — matches LNDRY violet and operational teal theme */
export const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; icon: string }
> = {
  PAYMENT_PENDING: { label: "Payment Pending", bg: "#FFF8E1", text: "#F3A929", icon: "●" },
  WAITING_VENDOR_CONFIRMATION: { label: "Waiting Confirm", bg: "#F5F3FF", text: "#6C63E8", icon: "●" },
  VENDOR_ACCEPTED: { label: "Accepted", bg: "#EAE8FF", text: "#5046C8", icon: "●" },
  PICKUP_ASSIGNED: { label: "Pickup Assigned", bg: "#EFF6FF", text: "#3B82F6", icon: "●" },
  GOING_FOR_PICKUP: { label: "Going for Pickup", bg: "#EFF6FF", text: "#3B82F6", icon: "●" },
  PICKUP_OTP_VERIFIED: { label: "Pickup OTP Verified", bg: "#DDF7F3", text: "#0FB5A6", icon: "✓" },
  PICKED_UP: { label: "Picked Up", bg: "#DDF7F3", text: "#0FB5A6", icon: "●" },
  RECEIVED_AT_VENDOR: { label: "At Vendor", bg: "#F5F3FF", text: "#6C63E8", icon: "●" },
  WASHING: { label: "Washing", bg: "#E8F5E9", text: "#16A36A", icon: "●" },
  DRYING: { label: "Drying", bg: "#E8F5E9", text: "#16A36A", icon: "●" },
  IRONING: { label: "Ironing", bg: "#E8F5E9", text: "#16A36A", icon: "●" },
  PACKED: { label: "Packed", bg: "#FFF3E0", text: "#F3A929", icon: "●" },
  DELIVERY_ASSIGNED: { label: "Delivery Assigned", bg: "#EFF6FF", text: "#3B82F6", icon: "●" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", bg: "#EFF6FF", text: "#3B82F6", icon: "●" },
  DELIVERY_OTP_VERIFIED: { label: "Delivery OTP Verified", bg: "#DDF7F3", text: "#0FB5A6", icon: "✓" },
  DELIVERED: { label: "Delivered", bg: "#ECFDF5", text: "#16A36A", icon: "✓" },
  PAYMENT_FAILED: { label: "Payment Failed", bg: "#FEF2F2", text: "#D94557", icon: "✕" },
  VENDOR_REJECTED: { label: "Vendor Rejected", bg: "#FEF2F2", text: "#D94557", icon: "✕" },
  AUTO_REJECTED: { label: "Auto Rejected", bg: "#FEF2F2", text: "#D94557", icon: "✕" },
  CUSTOMER_CANCELLED: { label: "Customer Cancelled", bg: "#FEF2F2", text: "#D94557", icon: "✕" },
  ADMIN_CANCELLED: { label: "Admin Cancelled", bg: "#FEF2F2", text: "#D94557", icon: "✕" },
  REFUNDED: { label: "Refunded", bg: "#EAE8FF", text: "#5046C8", icon: "↩" },
}

export const PAYMENT_METHODS = ["ONLINE", "WALLET", "MANUAL"] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  ONLINE: "Online (Razorpay)",
  WALLET: "Wallet",
  MANUAL: "Manual/Refund Settlement",
}

/** Allowed status transitions matching state machine */
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PAYMENT_PENDING: ["WAITING_VENDOR_CONFIRMATION", "PAYMENT_FAILED", "CUSTOMER_CANCELLED"],
  WAITING_VENDOR_CONFIRMATION: ["VENDOR_ACCEPTED", "VENDOR_REJECTED", "AUTO_REJECTED"],
  VENDOR_ACCEPTED: ["PICKUP_ASSIGNED", "ADMIN_CANCELLED"],
  PICKUP_ASSIGNED: ["GOING_FOR_PICKUP", "ADMIN_CANCELLED"],
  GOING_FOR_PICKUP: ["PICKUP_OTP_VERIFIED", "ADMIN_CANCELLED"],
  PICKUP_OTP_VERIFIED: ["PICKED_UP"],
  PICKED_UP: ["RECEIVED_AT_VENDOR", "ADMIN_CANCELLED"],
  RECEIVED_AT_VENDOR: ["WASHING", "DRYING", "IRONING", "PACKED"],
  WASHING: ["DRYING", "IRONING", "PACKED"],
  DRYING: ["IRONING", "PACKED"],
  IRONING: ["PACKED"],
  PACKED: ["DELIVERY_ASSIGNED", "ADMIN_CANCELLED"],
  DELIVERY_ASSIGNED: ["OUT_FOR_DELIVERY", "ADMIN_CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERY_OTP_VERIFIED", "ADMIN_CANCELLED"],
  DELIVERY_OTP_VERIFIED: ["DELIVERED"],
  DELIVERED: [],
  PAYMENT_FAILED: [],
  VENDOR_REJECTED: ["REFUNDED"],
  AUTO_REJECTED: ["REFUNDED"],
  CUSTOMER_CANCELLED: ["REFUNDED"],
  ADMIN_CANCELLED: ["REFUNDED"],
  REFUNDED: [],
}

/** Sidebar navigation items matching LNDRY system */
export const SIDEBAR_NAV = [
  {
    section: "MAIN",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
      { label: "Orders", href: "/orders", icon: "ClipboardList" },
      { label: "Vendors", href: "/vendors", icon: "Store" },
      { label: "Customers", href: "/customers", icon: "Users" },
    ],
  },
  {
    section: "SERVICES",
    items: [
      { label: "Laundry Categories", href: "/laundry-categories", icon: "Tags" },
      { label: "Garment Types", href: "/garment-types", icon: "Package" },
    ],
  },
  {
    section: "OPERATIONS",
    items: [
      { label: "Capacity & Slots", href: "/capacity", icon: "Settings" },
      { label: "Assignments", href: "/assignments", icon: "Bike" },
      { label: "Notifications", href: "/notifications", icon: "Bell" },
    ],
  },
  {
    section: "FINANCE",
    items: [
      { label: "Payments", href: "/payments", icon: "CreditCard" },
      { label: "Reconciliation", href: "/reconciliation", icon: "Receipt" },
    ],
  },
] as const

/** LNDRY Violet + Teal chart colors */
export const CATEGORY_COLORS = [
  "#6C63E8", // Care Violet
  "#5046C8", // Deep Care Violet
  "#887CF6", // Electric Lavender
  "#EAE8FF", // Soft Lavender
  "#0FB5A6", // Operational Teal
  "#0FB5A6", // Secondary Teal
]
