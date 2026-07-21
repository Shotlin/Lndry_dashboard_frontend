"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/services/categories.service"
import { qk } from "@/lib/query-keys"
import type { Category, CategoryTree } from "@/types"

function buildTree(categories: Category[]): CategoryTree[] {
  const map = new Map<string | null, CategoryTree[]>()

  categories.forEach((c) => {
    if (!map.has(c.parent_id)) map.set(c.parent_id, [])
  })

  categories.forEach((c) => {
    const parent = c.parent_id
    const list = map.get(parent) ?? []
    list.push({ ...c, children: [] })
    map.set(parent, list)
  })

  function attach(nodes: CategoryTree[]): CategoryTree[] {
    return nodes
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((node) => ({
        ...node,
        children: attach(map.get(node.id) ?? []),
      }))
  }

  return attach(map.get(null) ?? [])
}

export function useCategories() {
  const shopKey = "ALL"
  return useQuery({
    queryKey: qk.categories(shopKey, {}),
    queryFn: getCategories,
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useCategoryTree() {
  const shopKey = "ALL"
  return useQuery({
    queryKey: qk.categories(shopKey, {}),
    queryFn: getCategories,
    staleTime: 60 * 1000,
    select: buildTree,
    placeholderData: (prev) => prev,
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof createCategory>[0]) =>
      createCategory(payload),
    onSuccess: () => {
      toast.success("Category created")
      qc.invalidateQueries({ queryKey: ["categories"] })
    },
    onError: (e: any) => {
      const errMsg = e.response?.data?.message || e.message || "Failed to create category"
      toast.error(errMsg)
    },
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateCategory>[1] }) =>
      updateCategory(id, payload),
    onSuccess: () => {
      toast.success("Category updated")
      qc.invalidateQueries({ queryKey: ["categories"] })
    },
    onError: (e: any) => {
      const errMsg = e.response?.data?.message || e.message || "Failed to update category"
      toast.error(errMsg)
    },
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success("Category deleted")
      qc.invalidateQueries({ queryKey: ["categories"] })
    },
    onError: (e: any) => {
      const errMsg = e.response?.data?.message || e.message || "Failed to delete category"
      toast.error(errMsg)
    },
  })
}
