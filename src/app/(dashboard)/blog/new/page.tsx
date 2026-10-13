"use client"

import { BlogEditor } from "@/components/blog/BlogEditor"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { useBlogCategories } from "@/hooks/useBlog"

export default function NewBlogPostPage() {
  const { data: categories, isLoading } = useBlogCategories()
  if (isLoading || !categories) return <LoadingSkeleton variant="table" />
  return <BlogEditor post={null} categories={categories} />
}
