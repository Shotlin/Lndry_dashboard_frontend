"use client"

import { useParams } from "next/navigation"
import { BlogEditor } from "@/components/blog/BlogEditor"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { useBlogCategories, useBlogPost } from "@/hooks/useBlog"

export default function EditBlogPostPage() {
  const { id } = useParams<{ id: string }>()
  const { data: post, isLoading, isError } = useBlogPost(id)
  const { data: categories } = useBlogCategories()

  if (isLoading || !categories) return <LoadingSkeleton variant="table" />
  if (isError || !post) {
    return <EmptyState title="Post not found" description="It may have been deleted." />
  }
  // key: remount the editor if a different post is opened
  return <BlogEditor key={post.id} post={post} categories={categories} />
}
