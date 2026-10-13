import api from "@/lib/api"
import type {
  BlogCategory,
  BlogCategoryPayload,
  BlogListParams,
  BlogListResult,
  BlogPost,
  BlogPostPayload,
  BlogPostRow,
  BlogStats,
} from "@/types"

interface Envelope<T> {
  success: boolean
  message: string
  data: T
  page?: number
  total?: number
  totalPages?: number
}

export async function getBlogPosts(params: BlogListParams = {}): Promise<BlogListResult> {
  const { data } = await api.get<Envelope<BlogPostRow[]>>("/admin/blog/posts", { params })
  return {
    posts: data.data,
    total: data.total ?? data.data.length,
    page: data.page ?? 1,
    totalPages: data.totalPages ?? 1,
  }
}

export async function getBlogStats() {
  const { data } = await api.get<Envelope<BlogStats>>("/admin/blog/stats")
  return data.data
}

export async function getBlogPost(id: string) {
  const { data } = await api.get<Envelope<BlogPost>>(`/admin/blog/posts/${id}`)
  return data.data
}

export async function createBlogPost(payload: BlogPostPayload) {
  const { data } = await api.post<Envelope<BlogPost>>("/admin/blog/posts", payload)
  return data.data
}

export async function updateBlogPost(id: string, payload: BlogPostPayload) {
  const { data } = await api.put<Envelope<BlogPost>>(`/admin/blog/posts/${id}`, payload)
  return data.data
}

export async function deleteBlogPost(id: string) {
  await api.delete(`/admin/blog/posts/${id}`)
}

export async function getBlogCategories() {
  const { data } = await api.get<Envelope<BlogCategory[]>>("/admin/blog/categories")
  return data.data
}

export async function createBlogCategory(payload: BlogCategoryPayload) {
  const { data } = await api.post<Envelope<BlogCategory>>("/admin/blog/categories", payload)
  return data.data
}

export async function updateBlogCategory(id: string, payload: BlogCategoryPayload) {
  const { data } = await api.put<Envelope<BlogCategory>>(`/admin/blog/categories/${id}`, payload)
  return data.data
}

export async function deleteBlogCategory(id: string) {
  await api.delete(`/admin/blog/categories/${id}`)
}
