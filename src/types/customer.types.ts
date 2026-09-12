/** Customer in list view */
export interface Customer {
  id: string
  name: string | null
  phone: string
  email: string | null
  is_blocked: boolean
  block_reason: string | null
  order_count: number
  total_spent: number
  wallet_balance: number
  loyalty_points: number
  last_order_at: string | null
  created_at: string
  /**
   * Shop ids the customer has at least one allocation to (e.g. via past
   * orders or pincode/radius eligibility). The backend includes this on
   * shop-scoped responses so the dashboard can enforce vendor visibility
   * rules client-side without a second round-trip (Req 10.8, 10.10).
   *
   * Optional because the legacy `/admin/customers` endpoint does not yet
   * emit it for super-admin "HQ_MODE" responses; consumers must treat
   * `undefined` as "not enforced" and a present array as authoritative.
   */
  shop_allocations?: string[]
}

/** Customer detail with expanded info */
export interface CustomerDetail extends Customer {
  cancelled_count: number
  avg_order_value: number
  /** Most recently active device (from the `devices` table, updated on
   * every login), or `null` if the customer has never logged in from a
   * build that reports device info. */
  last_device: CustomerDevice | null
}

/** A customer's most recently active device. */
export interface CustomerDevice {
  platform: string
  /** Raw hardware model identifier (e.g. "SM-S911B" on Android, a
   * "iPhone15,3"-style identifier on iOS) — not a marketing name. */
  device_model: string | null
  app_version: string | null
  last_active_at: string
}

/** Customer address — raw backend column names (snake_case, matches
 * `GET /admin/customers/:id/addresses`'s `SELECT * FROM addresses`). */
export interface CustomerAddress {
  id: string
  label: string
  address_line1: string
  address_line2: string | null
  landmark: string | null
  city: string
  state: string | null
  pincode: string
  lat?: number | null
  lng?: number | null
  is_default: boolean
  created_at: string
  updated_at: string
}

/** Lightweight order for customer profile */
export interface CustomerOrder {
  id: string
  order_number: string
  total_amount: number
  status: string
  created_at: string
}

/** Filters for customer list */
export interface CustomerFilters {
  page?: number
  limit?: number
  search?: string
  status?: "active" | "blocked" | ""
  minOrders?: number
  maxOrders?: number
  minSpent?: number
  maxSpent?: number
  startDate?: string
  endDate?: string
  sort?: string
  order?: "asc" | "desc"
  /**
   * Restrict the result set to customers with at least one allocation to
   * this shop. Forwarded as the `shop_id` query param. Set by the
   * `useCustomers` hook in `SINGLE_SHOP` mode; omitted in `ALL_SHOPS` mode
   * (Req 10.8).
   */
  shop_id?: string
}
