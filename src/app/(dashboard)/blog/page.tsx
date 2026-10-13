"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarClock, Eye, FilePlus2, FileText, PenLine, Search, Tags } from "lucide-react"
import { useDebounce } from "use-debounce"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useBlogCategories, useBlogPosts, useBlogStats } from "@/hooks/useBlog"
import type { BlogListParams, BlogPostRow } from "@/types"

const isFuture = (value: string) => new Date(value).getTime() > Date.now()
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

function StatusBadge({ post }: { post: BlogPostRow }) {
  if (post.status !== "published") return <Badge variant="outline">Draft</Badge>
  if (post.publishedAt && isFuture(post.publishedAt)) return <Badge variant="secondary">Scheduled</Badge>
  return <Badge>Published</Badge>
}

export default function BlogPostsPage() {
  const [q, setQ] = useState("")
  const [debouncedQ] = useDebounce(q, 300)
  const [status, setStatus] = useState<string>("all")
  const [categoryId, setCategoryId] = useState<string>("all")
  const [page, setPage] = useState(1)

  const params: BlogListParams = {
    page,
    q: debouncedQ.trim() || undefined,
    status: status === "all" ? undefined : (status as BlogListParams["status"]),
    categoryId: categoryId === "all" ? undefined : categoryId,
  }
  const { data, isLoading } = useBlogPosts(params)
  const { data: stats } = useBlogStats()
  const { data: categories } = useBlogCategories()

  const cards = [
    ["Published", stats?.published, FileText],
    ["Scheduled", stats?.scheduled, CalendarClock],
    ["Drafts", stats?.drafts, PenLine],
    ["Total views", stats?.views, Eye],
  ] as const

  return (
    <div className="space-y-6">
      <PageHeader title="Blog" subtitle="Write, schedule and publish articles. They appear on lndry.in/blog automatically.">
        <Button asChild variant="outline" size="sm">
          <Link href="/blog/categories"><Tags className="mr-1.5 h-4 w-4" /> Categories</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/blog/new"><FilePlus2 className="mr-1.5 h-4 w-4" /> New post</Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([label, value, Icon]) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
            <p className="mt-3 text-2xl font-semibold">{value === undefined ? "–" : value.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Search by title or URL" className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setPage(1) }}>
          <SelectTrigger className="md:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden lg:table-cell">Length · keyword</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data || data.posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState title="No posts found" description="Write your first article to start ranking on Google." />
                </TableCell>
              </TableRow>
            ) : (
              data.posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="max-w-md">
                    <Link href={`/blog/${post.id}`} className="font-medium hover:text-primary">{post.title}</Link>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      /blog/{post.slug}{post.isFeatured ? " · Featured" : ""}{post.noindex ? " · Hidden from search" : ""}
                    </p>
                  </TableCell>
                  <TableCell><StatusBadge post={post} /></TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{post.category?.name ?? "—"}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {post.wordCount} words{post.focusKeyword ? ` · “${post.focusKeyword}”` : ""}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{post.viewCount.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(post.publishedAt ?? post.updatedAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-3 text-sm text-muted-foreground">
          <span>Page {data.page} of {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}
