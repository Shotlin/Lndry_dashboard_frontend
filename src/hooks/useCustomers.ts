"use client"

/**
 * Customers hooks — platform-wide list + per-customer detail / mutations.
 *
 * Wave 12 of the LNDRY dashboard.
 */

import { useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  getCustomers,
  getCustomerDetail,
  getCustomerOrders,
  getCustomerAddresses,
  setDefaultAddress,
  toggleBlockCustomer,
  notifyCustomer,
  exportCustomersCsv,
} from "@/services/customers.service"

import { qk } from "@/lib/query-keys"
import type { CustomerFilters } from "@/types"

/**
 * Sentinel `shopId` slot used in the list query key when the
 * Shop_Context_Store has not yet been hydrated. The query is gated by
 * `enabled` (see below) so it never fires in this state, but TanStack Query
 * still requires a stable key. Mirrors the convention from
 * `useShopProductsList` so cache snapshots line up across surfaces.
 */
const NONE_SHOP_KEY = "NONE"

export function useCustomers(filters: CustomerFilters) {
  const shopKey = "ALL"

  return useQuery({
    queryKey: qk.customers(shopKey, filters),
    queryFn: () => getCustomers(filters),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useCustomerDetail(customerId: string | null) {
  return useQuery({
    queryKey: ["customers", "detail", customerId],
    queryFn: () => getCustomerDetail(customerId!),
    enabled: !!customerId,
    staleTime: 30 * 1000,
  })
}

export function useCustomerOrders(customerId: string | null, page = 1) {
  return useQuery({
    queryKey: ["customers", "orders", customerId, page],
    queryFn: () => getCustomerOrders(customerId!, page),
    enabled: !!customerId,
    staleTime: 30 * 1000,
  })
}

export function useCustomerAddresses(customerId: string | null) {
  return useQuery({
    queryKey: ["customers", "addresses", customerId],
    queryFn: () => getCustomerAddresses(customerId!),
    enabled: !!customerId,
    staleTime: 30 * 1000,
  })
}

export function useSetDefaultAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ customerId, addressId }: { customerId: string; addressId: string }) =>
      setDefaultAddress(customerId, addressId),
    onSuccess: (_, { customerId }) => {
      toast.success("Default address updated")
      qc.invalidateQueries({ queryKey: ["customers", "addresses", customerId] })
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update default address"),
  })
}

export function useToggleBlockCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) =>
      toggleBlockCustomer(id, blocked),
    onSuccess: (_, { blocked }) => {
      toast.success(blocked ? "Customer blocked" : "Customer unblocked")
      // Prefix-based invalidate so every shop-scoped customers cache entry
      // (ALL, single-shop ids, "NONE") is dropped without us having to
      // enumerate scopes. Matches the convention from `useOrders`.
      qc.invalidateQueries({ queryKey: ["customers"] })
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update customer"),
  })
}


export function useNotifyCustomer() {
  return useMutation({
    mutationFn: ({
      id,
      title,
      body,
    }: {
      id: string
      title: string
      body: string
    }) => notifyCustomer(id, { title, body }),
    onSuccess: () => toast.success("Notification sent"),
    onError: (e: Error) => toast.error(e.message || "Failed to send notification"),
  })
}

export function useExportCustomers() {
  return useMutation({
    mutationFn: () => exportCustomersCsv(),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `customers-export-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Customers exported!")
    },
    onError: () => toast.error("Failed to export customers"),
  })
}
