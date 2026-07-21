"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2, Plus, RefreshCw } from "lucide-react"
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from "@/hooks/useNotifications"
import { toast } from "sonner"

export default function NotificationsPage() {
  const { data: templatesRaw, isLoading, isError, refetch } = useTemplates()
  const createTemplate = useCreateTemplate()
  const updateTemplate = useUpdateTemplate()
  const deleteTemplateMutation = useDeleteTemplate()

  const templates: any[] = Array.isArray(templatesRaw) ? templatesRaw : []

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pushTitle, setPushTitle] = useState("")
  const [messageBody, setMessageBody] = useState("")
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [newName, setNewName] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [newBody, setNewBody] = useState("")

  // Select first template by default when data loads
  useEffect(() => {
    if (templates.length > 0 && !selectedId) {
      const first = templates[0]
      setSelectedId(first.id)
      setPushTitle(first.title || "")
      setMessageBody(first.body || "")
    }
  }, [templates, selectedId])

  const selectedTemplate = templates.find((t: any) => t.id === selectedId)
  const variables = selectedTemplate?.variables ?? []

  const handleSelectTemplate = (t: any) => {
    setSelectedId(t.id)
    setPushTitle(t.title || "")
    setMessageBody(t.body || "")
  }

  const handleSave = () => {
    if (!selectedId) return
    updateTemplate.mutate(
      { id: selectedId, payload: { title: pushTitle, body: messageBody } },
      { onSuccess: () => toast.success("Template saved") }
    )
  }

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this template?")) return
    deleteTemplateMutation.mutate(id, {
      onSuccess: () => {
        if (selectedId === id) {
          setSelectedId(null)
          setPushTitle("")
          setMessageBody("")
        }
      },
    })
  }

  const handleCreateNew = () => {
    if (!newName.trim()) return
    createTemplate.mutate(
      { name: newName, title: newTitle || newName, body: newBody || "" } as any,
      {
        onSuccess: () => {
          setShowNewDialog(false)
          setNewName("")
          setNewTitle("")
          setNewBody("")
        },
      }
    )
  }

  const hasChanges = selectedTemplate && (pushTitle !== selectedTemplate.title || messageBody !== selectedTemplate.body)

  // Preview with variable replacement
  const previewText = messageBody
    .replace(/\{\{(\w+)\}\}/g, (_, v: string) => `[${v}]`)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-[#080f14]">Notification templates</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-[#6366F1] text-[#6366F1] hover:bg-[#EEF2FF] font-bold rounded-full h-10 px-5 text-[13px]"
            onClick={() => toast.info("Send test requires device token — configure in settings")}
          >
            Send test
          </Button>
          <Button
            className="bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold rounded-full h-10 px-5 text-[13px] shadow-[0_4px_14px_rgba(6,182,212,0.25)]"
            disabled={!hasChanges || updateTemplate.isPending}
            onClick={handleSave}
          >
            {updateTemplate.isPending ? "Saving..." : "Save template"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Template catalogue */}
        <div className="lndry-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-bold text-[#7e8998] uppercase tracking-wider">Template catalogue</h3>
            <button
              onClick={() => setShowNewDialog(true)}
              className="w-7 h-7 rounded-full bg-[#6366F1] text-white flex items-center justify-center hover:bg-[#4F46E5] transition-colors"
              title="New template"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-6">
              <p className="text-[12px] text-[#B91C1C] mb-2">Failed to load</p>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="rounded-full text-[11px]">
                <RefreshCw className="h-3 w-3 mr-1" /> Retry
              </Button>
            </div>
          ) : templates.length === 0 ? (
            <p className="text-[12px] text-[#7e8998] text-center py-6">No templates yet</p>
          ) : (
            <div className="space-y-1">
              {templates.map((t: any) => (
                <div key={t.id} className="flex items-center group">
                  <button
                    onClick={() => handleSelectTemplate(t)}
                    className={`flex-1 text-left px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
                      selectedId === t.id
                        ? "bg-[#6366F1] text-white"
                        : "text-[#334155] hover:bg-[#f4f4f8]"
                    }`}
                  >
                    {t.name || t.title}
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="ml-1 p-1.5 text-[#94a3b8] hover:text-[#B91C1C] opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete template"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Template detail */}
        <div className="lndry-card space-y-5">
          {!selectedTemplate ? (
            <div className="flex items-center justify-center py-16 text-[13px] text-[#7e8998]">
              Select a template from the catalogue
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] font-bold text-[#080f14]">{selectedTemplate.name || selectedTemplate.title}</h2>
                  <p className="text-[12px] text-[#7e8998] mt-1">
                    Channels: {selectedTemplate.channel || "push, SMS, email"}
                  </p>
                </div>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  selectedTemplate.is_active !== false ? "bg-[#ECFDF5] text-[#047857]" : "bg-[#F1F1F5] text-[#64748B]"
                }`}>
                  {selectedTemplate.is_active !== false ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#0f172a]">Push title</label>
                  <Input
                    value={pushTitle}
                    onChange={(e) => setPushTitle(e.target.value)}
                    className="bg-[#fafafd] border-[#e8e8ef] h-11 rounded-xl text-[13px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#0f172a]">Message body</label>
                  <textarea
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    rows={4}
                    className="w-full bg-[#fafafd] border border-[#e8e8ef] rounded-xl p-3 text-[13px] text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#6366F1] resize-none"
                  />
                </div>

                {/* Variables */}
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#0f172a]">Variables</label>
                  <div className="flex flex-wrap gap-2">
                    {variables.length > 0 ? variables.map((v: string) => (
                      <span key={v} className="inline-flex px-3 py-1.5 rounded-full border border-[#6366F1] text-[#6366F1] text-[11px] font-bold">{`{{${v}}}`}</span>
                    )) : (
                      <span className="text-[12px] text-[#7e8998]">No variables defined</span>
                    )}
                  </div>
                </div>

                {/* Preview */}
                <div className="lndry-card !bg-[#fafafd] !border-[#e8e8ef]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[13px] font-bold text-[#0f172a]">Preview validation</h3>
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] text-[10px] font-bold">
                      {messageBody.length > 0 ? "Valid" : "Empty"}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#334155] leading-relaxed">{previewText || "Enter a message body to see preview"}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New template dialog (simple overlay) */}
      {showNewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowNewDialog(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-bold text-[#080f14]">New template</h3>
            <div className="space-y-3">
              <Input
                placeholder="Template name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-11 rounded-xl text-[13px]"
              />
              <Input
                placeholder="Push title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-11 rounded-xl text-[13px]"
              />
              <textarea
                placeholder="Message body"
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                rows={3}
                className="w-full border border-[#e8e8ef] rounded-xl p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6366F1] resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" className="rounded-full" onClick={() => setShowNewDialog(false)}>Cancel</Button>
              <Button
                className="bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold rounded-full px-5"
                disabled={!newName.trim() || createTemplate.isPending}
                onClick={handleCreateNew}
              >
                {createTemplate.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
