"use client"

import { useEffect, useState } from "react"
import { Copy, Loader2, Plus, RefreshCw, Send, Trash2, FlaskConical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  useCreateTemplate, useDeleteTemplate, useDuplicateTemplate, useTemplates, useUpdateTemplate,
} from "@/hooks/useNotifications"
import { DeepLinkField } from "./DeepLinkField"
import { ImageField } from "./ImageField"
import { linkLabel, linkProblem } from "./deep-links"
import type { DeepLink, NotificationTemplate } from "@/types/notification.types"

interface Props {
  onUse: (t: NotificationTemplate) => void
  onTest: (t: NotificationTemplate) => void
}

function templateLink(t: NotificationTemplate): DeepLink | null {
  return t.deep_link_type ? { type: t.deep_link_type, params: t.deep_link_params ?? {} } : null
}

/** Templates are optional, reusable presets — a notification never needs one. */
export function TemplatesTab({ onUse, onTest }: Props) {
  const { data, isLoading, isError, refetch } = useTemplates()
  const create = useCreateTemplate()
  const update = useUpdateTemplate()
  const duplicate = useDuplicateTemplate()
  const remove = useDeleteTemplate()

  const templates = (data ?? []).filter((t) => t.type === "PUSH" || !t.type)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = templates.find((t) => t.id === selectedId) ?? null

  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [image, setImage] = useState<string | undefined>()
  const [link, setLink] = useState<DeepLink | null>(null)
  const [active, setActive] = useState(true)

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")

  // Load the selected template into the editor; pick the first one initially.
  useEffect(() => {
    if (!selectedId && templates.length) setSelectedId(templates[0].id)
  }, [templates, selectedId])
  useEffect(() => {
    if (!selected) return
    setName(selected.name); setTitle(selected.title); setBody(selected.body)
    setImage(selected.image_url ?? undefined); setLink(templateLink(selected)); setActive(selected.is_active !== false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, selected?.updated_at])

  const problem = linkProblem(link)
  const dirty = !!selected && (
    name !== selected.name || title !== selected.title || body !== selected.body ||
    (image ?? "") !== (selected.image_url ?? "") || active !== (selected.is_active !== false) ||
    JSON.stringify(link ?? null) !== JSON.stringify(templateLink(selected))
  )

  function save() {
    if (!selected || problem || !name.trim() || !title.trim() || !body.trim()) return
    update.mutate({
      id: selected.id,
      payload: {
        name: name.trim(), title: title.trim(), body: body.trim(), is_active: active,
        image_url: image ?? "",
        deep_link_type: link?.type ?? null,
        deep_link_params: link?.params ?? {},
      },
    })
  }

  function remove_(t: NotificationTemplate) {
    if (!window.confirm(`Delete the template "${t.name}"? Campaigns already sent keep their content.`)) return
    remove.mutate(t.id, { onSuccess: () => { if (selectedId === t.id) setSelectedId(null) } })
  }

  function createNew() {
    if (!newName.trim()) return
    create.mutate(
      { name: newName.trim(), title: newName.trim(), body: "Write your message here" },
      { onSuccess: (t) => { setCreating(false); setNewName(""); setSelectedId(t.id) } }
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[290px_1fr]">
      {/* Catalogue */}
      <div className="lndry-card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#7e8998]">Templates</h3>
          <button
            onClick={() => setCreating(true)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6366F1] text-white transition-colors hover:bg-[#4F46E5]"
            title="New template"
            aria-label="New template"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}</div>
        ) : isError ? (
          <div className="py-6 text-center">
            <p className="mb-2 text-[12px] text-[#B91C1C]">Failed to load templates</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="rounded-full text-[11px]"><RefreshCw className="mr-1 h-3 w-3" /> Retry</Button>
          </div>
        ) : templates.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-[#7e8998]">No templates yet. Templates are optional shortcuts for messages you send often.</p>
        ) : (
          <div className="space-y-1">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`w-full rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition-colors ${selectedId === t.id ? "bg-[#6366F1] text-white" : "text-[#334155] hover:bg-[#f4f4f8]"}`}
              >
                <span className="block truncate">{t.name}</span>
                <span className={`block truncate text-[11px] font-normal ${selectedId === t.id ? "text-white/80" : "text-[#94a3b8]"}`}>{linkLabel(templateLink(t))}{t.is_active === false ? " · inactive" : ""}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="lndry-card space-y-5">
        {!selected ? (
          <div className="flex items-center justify-center py-16 text-[13px] text-[#7e8998]">Select a template, or create one with +</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[18px] font-bold text-[#080f14]">Edit template</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => onTest(selected)}><FlaskConical className="mr-1.5 h-3.5 w-3.5" /> Send test</Button>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => duplicate.mutate(selected.id, { onSuccess: (t) => setSelectedId(t.id) })} disabled={duplicate.isPending}><Copy className="mr-1.5 h-3.5 w-3.5" /> Duplicate</Button>
                <Button variant="outline" size="sm" className="rounded-full text-[#B91C1C] hover:text-[#B91C1C]" onClick={() => remove_(selected)}><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete</Button>
                <Button size="sm" className="rounded-full bg-[#6366F1] font-bold text-white hover:bg-[#4F46E5]" onClick={() => onUse(selected)}><Send className="mr-1.5 h-3.5 w-3.5" /> Use in notification</Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5"><Label>Template name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-xl text-[13px]" /></div>
              <div className="flex items-end justify-between rounded-xl border border-[#e8e8ef] px-3 py-2">
                <div><p className="text-[13px] font-semibold text-[#0f172a]">Active</p><p className="text-[12px] text-[#64748b]">Inactive templates are hidden when composing.</p></div>
                <Switch checked={active} onCheckedChange={setActive} />
              </div>
            </div>
            <div className="space-y-1.5"><Label>Push title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 rounded-xl text-[13px]" /></div>
            <div className="space-y-1.5"><Label>Message</Label><Textarea value={body} rows={4} onChange={(e) => setBody(e.target.value)} className="rounded-xl text-[13px]" /></div>
            <div className="space-y-1.5"><Label>Image <span className="font-normal text-[#94a3b8]">(optional)</span></Label><ImageField value={image} onChange={setImage} /></div>
            <div className="space-y-1.5"><Label>Default destination <span className="font-normal text-[#94a3b8]">(optional)</span></Label><DeepLinkField value={link} onChange={setLink} />{problem && <p className="text-[12px] text-[#B91C1C]">{problem}</p>}</div>

            <div className="flex justify-end">
              <Button className="rounded-full bg-[#6366F1] px-5 font-bold text-white hover:bg-[#4F46E5]" disabled={!dirty || !!problem || update.isPending} onClick={save}>
                {update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save template
              </Button>
            </div>
          </>
        )}
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New template</DialogTitle></DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name">Template name</Label>
            <Input id="tpl-name" autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") createNew() }} placeholder="e.g. Weekend offer" className="h-10 rounded-xl text-[13px]" />
            <p className="text-[12px] text-[#64748b]">You&apos;ll fill in the message, image and destination next.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-full" onClick={() => setCreating(false)}>Cancel</Button>
            <Button className="rounded-full bg-[#6366F1] px-5 font-bold text-white hover:bg-[#4F46E5]" disabled={!newName.trim() || create.isPending} onClick={createNew}>{create.isPending ? "Creating…" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
