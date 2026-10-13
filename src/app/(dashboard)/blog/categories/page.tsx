"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useBlogCategories, useDeleteBlogCategory, useSaveBlogCategory } from "@/hooks/useBlog"
import { slugify } from "@/lib/blog-text"
import type { BlogCategory } from "@/types"

type Draft = { id: string | null; name: string; slug: string; description: string; sortOrder: number }
const empty: Draft = { id: null, name: "", slug: "", description: "", sortOrder: 0 }

export default function BlogCategoriesPage() {
  const { data: categories, isLoading } = useBlogCategories()
  const save = useSaveBlogCategory()
  const remove = useDeleteBlogCategory()
  const [draft, setDraft] = useState<Draft>(empty)
  const [slugTouched, setSlugTouched] = useState(false)

  const edit = (c: BlogCategory) => {
    setDraft({ id: c.id, name: c.name, slug: c.slug, description: c.description ?? "", sortOrder: c.sortOrder })
    setSlugTouched(true)
  }
  const reset = () => {
    setDraft(empty)
    setSlugTouched(false)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    save.mutate(
      {
        id: draft.id,
        payload: {
          name: draft.name,
          slug: draft.slug || slugify(draft.name, 80),
          description: draft.description,
          sortOrder: draft.sortOrder,
        },
      },
      { onSuccess: reset },
    )
  }

  const onDelete = (c: BlogCategory) => {
    const note = c.postCount ? ` Its ${c.postCount} post(s) will become uncategorised.` : ""
    if (confirm(`Delete “${c.name}”?${note}`)) remove.mutate(c.id)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Blog categories" subtitle="Each category gets its own page on the website.">
        <Button asChild variant="outline" size="sm">
          <Link href="/blog"><ArrowLeft className="mr-1.5 h-4 w-4" /> Posts</Link>
        </Button>
      </PageHeader>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Posts</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4}><div className="h-4 w-40 animate-pulse rounded bg-muted" /></TableCell></TableRow>
              ) : !categories || categories.length === 0 ? (
                <TableRow><TableCell colSpan={4}><EmptyState title="No categories yet" description="Add your first one using the form." /></TableCell></TableRow>
              ) : (
                categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">/blog/category/{c.slug}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.sortOrder}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{c.postCount}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Edit ${c.name}`} onClick={() => edit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label={`Delete ${c.name}`} onClick={() => onDelete(c)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-5">
          <h2 className="text-base font-semibold">{draft.id ? "Edit category" : "New category"}</h2>
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" required minLength={2} maxLength={60} value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value, slug: slugTouched ? d.slug : slugify(e.target.value, 80) }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-slug">URL</Label>
            <Input id="cat-slug" required maxLength={80} value={draft.slug}
              onChange={(e) => { setSlugTouched(true); setDraft((d) => ({ ...d, slug: slugify(e.target.value, 80) })) }} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Description (shown on the category page)</Label>
            <Textarea id="cat-desc" rows={3} maxLength={300} value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-order">Display order (lower first)</Label>
            <Input id="cat-order" type="number" min={0} max={1000} value={draft.sortOrder}
              onChange={(e) => setDraft((d) => ({ ...d, sortOrder: Number(e.target.value) || 0 }))} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={save.isPending}>
              <Plus className="mr-1.5 h-4 w-4" /> {draft.id ? "Save changes" : "Add category"}
            </Button>
            {draft.id && <Button type="button" variant="outline" onClick={reset}>Cancel</Button>}
          </div>
        </form>
      </div>
    </div>
  )
}
