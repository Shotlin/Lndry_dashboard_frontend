"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createBlogCategory,
  createBlogPost,
  deleteBlogCategory,
  deleteBlogPost,
  getBlogCategories,
  getBlogPost,
  getBlogPosts,
  getBlogStats,
  updateBlogCategory,
  updateBlogPost,
} from "@/services/blog.service"
import type { BlogCategoryPayload, BlogListParams, BlogPostPayload } from "@/types"

/** Message + per-field errors from a backend error response. */
export function blogErrorInfo(error: unknown): { message: string; fieldErrors: Record<string, string[]> } {
  const resp = (error as { response?: { data?: { message?: string; error?: { field_errors?: Record<string, string[]> } } } })
    ?.response?.data
  return {
    message: resp?.message ?? (error instanceof Error ? error.message : "Something went wrong"),
    fieldErrors: resp?.error?.field_errors ?? {},
  }
}

const POSTS = ["blog-posts"]
const CATEGORIES = ["blog-categories"]

export function useBlogPosts(params: BlogListParams) {
  return useQuery({ queryKey: [...POSTS, params], queryFn: () => getBlogPosts(params), staleTime: 15_000 })
}

export function useBlogStats() {
  return useQuery({ queryKey: ["blog-stats"], queryFn: getBlogStats, staleTime: 15_000 })
}

export function useBlogPost(id: string) {
  return useQuery({ queryKey: ["blog-post", id], queryFn: () => getBlogPost(id), staleTime: 0, gcTime: 0 })
}

export function useBlogCategories() {
  return useQuery({ queryKey: CATEGORIES, queryFn: getBlogCategories, staleTime: 30_000 })
}

export function useSaveBlogPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | null; payload: BlogPostPayload }) =>
      id ? updateBlogPost(id, payload) : createBlogPost(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: POSTS })
      qc.invalidateQueries({ queryKey: ["blog-stats"] })
      qc.invalidateQueries({ queryKey: CATEGORIES })
    },
  })
}

export function useDeleteBlogPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBlogPost(id),
    onSuccess: () => {
      toast.success("Post deleted")
      qc.invalidateQueries({ queryKey: POSTS })
      qc.invalidateQueries({ queryKey: ["blog-stats"] })
    },
    onError: (e) => toast.error(blogErrorInfo(e).message),
  })
}

export function useSaveBlogCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | null; payload: BlogCategoryPayload }) =>
      id ? updateBlogCategory(id, payload) : createBlogCategory(payload),
    onSuccess: (_d, vars) => {
      toast.success(vars.id ? "Category updated" : "Category added")
      qc.invalidateQueries({ queryKey: CATEGORIES })
    },
    onError: (e) => toast.error(blogErrorInfo(e).message),
  })
}

export function useDeleteBlogCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBlogCategory(id),
    onSuccess: () => {
      toast.success("Category deleted")
      qc.invalidateQueries({ queryKey: CATEGORIES })
      qc.invalidateQueries({ queryKey: POSTS })
    },
    onError: (e) => toast.error(blogErrorInfo(e).message),
  })
}
