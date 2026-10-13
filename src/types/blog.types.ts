/** Blog post / category shapes — camelCase, as formatted by the backend. */
export type BlogStatus = "draft" | "published"

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description: string | null
  sortOrder: number
  postCount: number
}

export interface BlogPostRow {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImageUrl: string | null
  coverImageAlt: string | null
  category: { name: string; slug: string } | null
  tags: string[]
  authorName: string
  publishedAt: string | null
  readingMinutes: number
  viewCount: number
  isFeatured: boolean
  status: BlogStatus
  noindex: boolean
  updatedAt: string
  wordCount: number
  focusKeyword: string | null
}

export interface BlogPost extends BlogPostRow {
  contentHtml: string
  metaTitle: string | null
  metaDescription: string | null
  canonicalUrl: string | null
  ogImageUrl: string | null
  categoryId: string | null
  createdAt: string
}

export interface BlogStats {
  published: number
  scheduled: number
  drafts: number
  views: number
}

export interface BlogListParams {
  status?: "draft" | "published" | "scheduled"
  q?: string
  categoryId?: string
  page?: number
}

export interface BlogListResult {
  posts: BlogPostRow[]
  total: number
  page: number
  totalPages: number
}

export interface BlogPostPayload {
  title: string
  slug: string
  excerpt: string
  contentHtml: string
  coverImageUrl: string
  coverImageAlt: string
  categoryId: string | null
  tags: string[]
  authorName: string
  status: BlogStatus
  publishedAt: string | null
  isFeatured: boolean
  focusKeyword: string
  metaTitle: string
  metaDescription: string
  canonicalUrl: string
  ogImageUrl: string
  noindex: boolean
}

export interface BlogCategoryPayload {
  name: string
  slug: string
  description: string
  sortOrder: number
}
