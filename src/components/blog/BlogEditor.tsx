"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink, ImagePlus, LoaderCircle, Save, Send, Trash2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RichTextEditor } from "@/components/blog/RichTextEditor"
import { SeoPanel } from "@/components/blog/SeoPanel"
import { blogErrorInfo, useDeleteBlogPost, useSaveBlogPost } from "@/hooks/useBlog"
import { slugify } from "@/lib/blog-text"
import { uploadImage } from "@/services/uploads.service"
import type { BlogCategory, BlogPost, BlogStatus } from "@/types"

const SITE_URL = "https://lndry.in"

interface FormState {
  title: string
  slug: string
  excerpt: string
  contentHtml: string
  coverImageUrl: string
  coverImageAlt: string
  categoryId: string
  tags: string[]
  authorName: string
  status: BlogStatus
  publishedAt: string // datetime-local value, "" = not set
  isFeatured: boolean
  focusKeyword: string
  metaTitle: string
  metaDescription: string
  canonicalUrl: string
  ogImageUrl: string
  noindex: boolean
}

const isFuture = (value: string) => new Date(value).getTime() > Date.now()

const toLocalInput = (iso: string | null) => {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function initialState(post: BlogPost | null): FormState {
  return {
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    contentHtml: post?.contentHtml ?? "",
    coverImageUrl: post?.coverImageUrl ?? "",
    coverImageAlt: post?.coverImageAlt ?? "",
    categoryId: post?.categoryId ?? "",
    tags: post?.tags ?? [],
    authorName: post?.authorName ?? "LNDRY Team",
    status: post?.status ?? "draft",
    publishedAt: toLocalInput(post?.publishedAt ?? null),
    isFeatured: post?.isFeatured ?? false,
    focusKeyword: post?.focusKeyword ?? "",
    metaTitle: post?.metaTitle ?? "",
    metaDescription: post?.metaDescription ?? "",
    canonicalUrl: post?.canonicalUrl ?? "",
    ogImageUrl: post?.ogImageUrl ?? "",
    noindex: post?.noindex ?? false,
  }
}

function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-semibold">{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
    </div>
  )
}

export function BlogEditor({ post, categories }: { post: BlogPost | null; categories: BlogCategory[] }) {
  const router = useRouter()
  const saveMutation = useSaveBlogPost()
  const deleteMutation = useDeleteBlogPost()
  const [form, setForm] = useState<FormState>(() => initialState(post))
  const [postId, setPostId] = useState<string | null>(post?.id ?? null)
  const [slugTouched, setSlugTouched] = useState(Boolean(post))
  const [saving, setSaving] = useState<null | "draft" | "publish">(null)
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [tagInput, setTagInput] = useState("")
  const [coverUploading, setCoverUploading] = useState(false)
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialState(post)))
  const coverInput = useRef<HTMLInputElement>(null)

  const dirty = useMemo(() => JSON.stringify(form) !== savedSnapshot, [form, savedSnapshot])

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  async function uploadCover(file: File) {
    setCoverUploading(true)
    setMessage(null)
    try {
      const { url } = await uploadImage(file, undefined, "blog")
      update("coverImageUrl", url)
    } catch (error) {
      setMessage({ kind: "error", text: blogErrorInfo(error).message })
    } finally {
      setCoverUploading(false)
    }
  }

  const save = useCallback(
    async (nextStatus: "draft" | "publish") => {
      setSaving(nextStatus)
      setMessage(null)
      setFieldErrors({})

      const status: BlogStatus = nextStatus === "publish" ? "published" : "draft"
      const slug = form.slug || slugify(form.title)
      try {
        const saved = await saveMutation.mutateAsync({
          id: postId,
          payload: {
            title: form.title,
            slug,
            excerpt: form.excerpt,
            contentHtml: form.contentHtml,
            coverImageUrl: form.coverImageUrl,
            coverImageAlt: form.coverImageAlt,
            categoryId: form.categoryId || null,
            tags: form.tags,
            authorName: form.authorName,
            status,
            publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
            isFeatured: form.isFeatured,
            focusKeyword: form.focusKeyword,
            metaTitle: form.metaTitle,
            metaDescription: form.metaDescription,
            canonicalUrl: form.canonicalUrl,
            ogImageUrl: form.ogImageUrl,
            noindex: form.noindex,
          },
        })

        const next: FormState = {
          ...form,
          slug: saved.slug,
          status,
          publishedAt: status === "published" ? toLocalInput(saved.publishedAt) : form.publishedAt,
        }
        setForm(next)
        setSavedSnapshot(JSON.stringify(next))
        setSlugTouched(true)

        const scheduled = status === "published" && saved.publishedAt && isFuture(saved.publishedAt)
        setMessage({
          kind: "ok",
          text: status === "draft" ? "Draft saved." : scheduled ? "Scheduled — it will go live automatically." : "Published. It is live on the website.",
        })
        if (!postId) {
          setPostId(saved.id)
          router.replace(`/blog/${saved.id}`)
        }
      } catch (error) {
        const info = blogErrorInfo(error)
        setFieldErrors(info.fieldErrors)
        setMessage({ kind: "error", text: info.message })
      } finally {
        setSaving(null)
      }
    },
    [form, postId, router, saveMutation],
  )

  // Ctrl/Cmd + S saves.
  const saveRef = useRef(save)
  const statusRef = useRef(form.status)
  useEffect(() => {
    saveRef.current = save
    statusRef.current = form.status
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        void saveRef.current(statusRef.current === "published" ? "publish" : "draft")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function remove() {
    if (!postId || !window.confirm("Delete this post permanently? It will disappear from the website. This cannot be undone.")) return
    deleteMutation.mutate(postId, {
      onSuccess: () => {
        setSavedSnapshot(JSON.stringify(form))
        router.replace("/blog")
      },
    })
  }

  // Accepts one tag or several (e.g. pasted "silk, saree, care") and merges them in one update.
  function addTags(raws: string[]) {
    const cleaned = raws.map((raw) => raw.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 40)).filter(Boolean)
    if (cleaned.length === 0) return
    setForm((prev) => {
      const merged = [...prev.tags]
      for (const tag of cleaned) {
        if (merged.length >= 12) break
        if (!merged.includes(tag)) merged.push(tag)
      }
      return { ...prev, tags: merged }
    })
  }

  const err = (key: string) => fieldErrors[key]?.[0]
  const isLive = form.status === "published" && postId
  const scheduledFuture = form.status === "published" && form.publishedAt && isFuture(form.publishedAt)

  return (
    <div className="grid gap-5">
      <div className="sticky top-0 z-30 -mx-1 flex flex-wrap items-center justify-between gap-3 border-b bg-background/95 px-1 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
            <ArrowLeft size={16} aria-hidden="true" /> Posts
          </Link>
          <Badge variant={form.status === "published" && !scheduledFuture ? "default" : "outline"}>
            {scheduledFuture ? "Scheduled" : form.status === "published" ? "Published" : "Draft"}
          </Badge>
          {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isLive && (
            <Button asChild variant="ghost" size="sm">
              <a href={`${SITE_URL}/blog/${form.slug}`} target="_blank" rel="noreferrer">
                View <ExternalLink size={14} className="ml-1.5" aria-hidden="true" />
              </a>
            </Button>
          )}
          {postId && (
            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={remove} disabled={deleteMutation.isPending} aria-label="Delete post">
              <Trash2 size={15} aria-hidden="true" />
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => save("draft")} disabled={saving !== null}>
            {saving === "draft" ? <LoaderCircle size={15} className="mr-2 animate-spin" /> : <Save size={15} className="mr-2" aria-hidden="true" />}
            {form.status === "published" ? "Revert to draft" : "Save draft"}
          </Button>
          <Button type="button" size="sm" onClick={() => save("publish")} disabled={saving !== null}>
            {saving === "publish" ? <LoaderCircle size={15} className="mr-2 animate-spin" /> : <Send size={15} className="mr-2" aria-hidden="true" />}
            {form.status === "published" ? "Update" : form.publishedAt && isFuture(form.publishedAt) ? "Schedule" : "Publish"}
          </Button>
        </div>
      </div>

      {message && (
        <p
          role="status"
          className={`rounded-md border px-4 py-3 text-sm font-semibold ${
            message.kind === "ok" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-destructive/30 bg-destructive/5 text-destructive"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="grid min-w-0 gap-4">
          <div>
            <label htmlFor="post-title" className="sr-only">Post title</label>
            <textarea
              id="post-title"
              rows={2}
              value={form.title}
              maxLength={160}
              onChange={(e) => {
                update("title", e.target.value)
                if (!slugTouched) update("slug", slugify(e.target.value))
              }}
              placeholder="Post title"
              className="w-full resize-none rounded-md border border-transparent bg-transparent px-1 text-3xl font-bold leading-tight tracking-tight outline-none placeholder:text-muted-foreground/60 focus:border-border focus:bg-card"
            />
            {err("title") && <p className="text-xs font-semibold text-destructive">{err("title")}</p>}
            <div className="mt-1 flex items-center gap-1 px-1 text-sm text-muted-foreground">
              <span className="shrink-0">lndry.in/blog/</span>
              <input
                aria-label="URL slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  update("slug", slugify(e.target.value, 120))
                }}
                placeholder="url-slug"
                className="min-w-0 flex-1 border-b border-dashed bg-transparent py-1 font-semibold text-foreground outline-none focus:border-primary"
              />
            </div>
            {err("slug") && <p className="px-1 text-xs font-semibold text-destructive">{err("slug")}</p>}
          </div>

          <RichTextEditor
            initialHtml={form.contentHtml}
            onChange={(html) => setForm((prev) => ({ ...prev, contentHtml: html }))}
            onError={(text) => setMessage({ kind: "error", text })}
          />
          {err("contentHtml") && <p className="text-xs font-semibold text-destructive">{err("contentHtml")}</p>}
        </div>

        <aside className="rounded-lg border bg-card xl:sticky xl:top-20 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
          <Tabs defaultValue="post">
            <TabsList className="grid h-12 w-full grid-cols-2 rounded-none border-b bg-transparent p-0">
              <TabsTrigger value="post" className="h-12 rounded-none">Post</TabsTrigger>
              <TabsTrigger value="seo" className="h-12 rounded-none">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="post" className="m-0 grid gap-5 p-5">
              <Field label="Publish date & time" htmlFor="post-date" hint="Leave empty to publish immediately. A future date schedules the post." error={err("publishedAt")}>
                <Input id="post-date" type="datetime-local" value={form.publishedAt} onChange={(e) => update("publishedAt", e.target.value)} />
              </Field>

              <Field label="Category" hint="Manage categories from Blog → Categories.">
                <Select value={form.categoryId || "none"} onValueChange={(v) => update("categoryId", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="No category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={`Tags (${form.tags.length}/12)`} htmlFor="post-tags" hint="Press Enter or comma to add.">
                <div className="flex flex-wrap gap-1.5 rounded-md border p-2 focus-within:border-primary">
                  {form.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {tag}
                      <button type="button" aria-label={`Remove tag ${tag}`} onClick={() => update("tags", form.tags.filter((t) => t !== tag))}><X size={12} /></button>
                    </span>
                  ))}
                  <input
                    id="post-tags"
                    value={tagInput}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v.includes(",")) {
                        addTags(v.split(","))
                        setTagInput("")
                      } else setTagInput(v)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTags([tagInput])
                        setTagInput("")
                      } else if (e.key === "Backspace" && !tagInput && form.tags.length) {
                        update("tags", form.tags.slice(0, -1))
                      }
                    }}
                    onBlur={() => {
                      addTags([tagInput])
                      setTagInput("")
                    }}
                    className="min-w-24 flex-1 bg-transparent px-1 py-1 text-sm outline-none"
                    placeholder={form.tags.length ? "" : "e.g. silk, saree"}
                  />
                </div>
              </Field>

              <Field label="Cover image" hint="Shown on cards and used for social sharing. 1200×630 works best.">
                {form.coverImageUrl ? (
                  <div className="relative overflow-hidden rounded-md border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.coverImageUrl} alt="" className="aspect-[1200/630] w-full object-cover" />
                    <button type="button" onClick={() => update("coverImageUrl", "")} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-white hover:bg-black" aria-label="Remove cover image"><X size={15} /></button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverInput.current?.click()}
                    disabled={coverUploading}
                    className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/40 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {coverUploading ? <LoaderCircle className="animate-spin" size={20} /> : <ImagePlus size={20} aria-hidden="true" />}
                    {coverUploading ? "Uploading…" : "Upload cover image"}
                  </button>
                )}
                <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="sr-only" tabIndex={-1}
                  onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void uploadCover(f) }} />
                <Input aria-label="Cover image alt text" value={form.coverImageAlt} onChange={(e) => update("coverImageAlt", e.target.value)} placeholder="Describe the cover image (alt text)" className="mt-2" maxLength={200} />
              </Field>

              <Field label="Short summary" htmlFor="post-excerpt" hint="Shown on cards and used if there is no meta description. Left empty, it is generated from the article." error={err("excerpt")}>
                <Textarea id="post-excerpt" rows={3} maxLength={400} value={form.excerpt} onChange={(e) => update("excerpt", e.target.value)} />
              </Field>

              <Field label="Author name" htmlFor="post-author">
                <Input id="post-author" value={form.authorName} onChange={(e) => update("authorName", e.target.value)} maxLength={80} />
              </Field>

              <div className="flex items-start justify-between gap-3 rounded-md border p-3">
                <div>
                  <Label htmlFor="post-featured" className="text-sm font-semibold">Featured post</Label>
                  <p className="text-xs text-muted-foreground">Shown large at the top of the blog (the newest featured post wins).</p>
                </div>
                <Switch id="post-featured" checked={form.isFeatured} onCheckedChange={(v) => update("isFeatured", v)} />
              </div>
            </TabsContent>

            <TabsContent value="seo" className="m-0 grid gap-5 p-5">
              <Field label="Focus keyword" htmlFor="seo-keyword" hint="The one phrase this article should rank for — e.g. “dry cleaning in Pune”.">
                <Input id="seo-keyword" value={form.focusKeyword} onChange={(e) => update("focusKeyword", e.target.value)} maxLength={80} />
              </Field>
              <Field label="SEO title" htmlFor="seo-title" hint="Leave empty to use the post title. Best 30–60 characters.">
                <Input id="seo-title" value={form.metaTitle} onChange={(e) => update("metaTitle", e.target.value)} placeholder={form.title} maxLength={120} />
              </Field>
              <Field label="Meta description" htmlFor="seo-description" hint="The text under your title in Google. Best 120–160 characters.">
                <Textarea id="seo-description" rows={3} value={form.metaDescription} onChange={(e) => update("metaDescription", e.target.value)} placeholder={form.excerpt} maxLength={320} />
              </Field>
              <Field label="Social share image URL" htmlFor="seo-og" hint="Optional. Defaults to the cover image." error={err("ogImageUrl")}>
                <Input id="seo-og" value={form.ogImageUrl} onChange={(e) => update("ogImageUrl", e.target.value)} placeholder="https://…" />
              </Field>
              <Field label="Canonical URL" htmlFor="seo-canonical" hint="Only set this if the article was first published elsewhere." error={err("canonicalUrl")}>
                <Input id="seo-canonical" value={form.canonicalUrl} onChange={(e) => update("canonicalUrl", e.target.value)} placeholder="https://…" />
              </Field>
              <div className="flex items-start justify-between gap-3 rounded-md border p-3">
                <div>
                  <Label htmlFor="seo-noindex" className="text-sm font-semibold">Hide from search engines</Label>
                  <p className="text-xs text-muted-foreground">Adds “noindex” and removes it from the sitemap.</p>
                </div>
                <Switch id="seo-noindex" checked={form.noindex} onCheckedChange={(v) => update("noindex", v)} />
              </div>
              <hr />
              <SeoPanel
                slug={form.slug}
                input={{
                  title: form.title,
                  slug: form.slug,
                  excerpt: form.excerpt,
                  contentHtml: form.contentHtml,
                  focusKeyword: form.focusKeyword,
                  metaTitle: form.metaTitle,
                  metaDescription: form.metaDescription,
                  coverImageUrl: form.coverImageUrl,
                  coverImageAlt: form.coverImageAlt,
                }}
              />
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  )
}
