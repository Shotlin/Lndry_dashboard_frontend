"use client"

import { useState } from "react"
import { Loader2, AlertCircle, Plus, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  useVendorCategories,
  useVendorServicesAdmin,
  useVendorServiceDetailsAdmin,
  useCreateVendorServiceAdmin,
  useUpdateVendorServiceAdmin,
  useDeleteVendorServiceAdmin,
  useAddGarmentRateAdmin,
  useUpdateGarmentRateAdmin,
  useDeleteGarmentRateAdmin,
} from "@/hooks/useVendorCatalogue"
import type { VendorCatalogueService } from "@/services/vendor-catalogue.service"

const APPROVAL_STYLES: Record<string, string> = {
  APPROVED: "bg-success-bg text-success border-0",
  PENDING: "bg-warning-bg text-warning border-0",
  REJECTED: "bg-danger-bg text-danger border-0",
}

type RateDraft = { price?: string; available?: boolean }

function GarmentRatesPanel({ vendorId, serviceId }: { vendorId: string; serviceId: string }) {
  const { data, isLoading } = useVendorServiceDetailsAdmin(vendorId, serviceId)
  const addRate = useAddGarmentRateAdmin(vendorId)
  const updateRate = useUpdateGarmentRateAdmin(vendorId)
  const deleteRate = useDeleteGarmentRateAdmin(vendorId)
  const [newGarmentName, setNewGarmentName] = useState("")
  const [newRate, setNewRate] = useState("")
  // Edits stay here until "Save changes" is pressed; nothing is sent while typing.
  const [drafts, setDrafts] = useState<Record<string, RateDraft>>({})
  const [saving, setSaving] = useState(false)

  if (isLoading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading rates…</div>
  }

  const garments = data?.garments ?? []
  const setDraft = (id: string, patch: RateDraft) => setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }))

  // Only fields that really differ from what is saved count as a change.
  const changes = garments.flatMap((g) => {
    const d = drafts[g.garment_rate_id]
    if (!d) return []
    const payload: { rate_paise?: number; is_available?: boolean } = {}
    if (d.price !== undefined) {
      const rupees = parseFloat(d.price)
      if (!Number.isNaN(rupees) && Math.round(rupees * 100) !== g.rate_paise) payload.rate_paise = Math.round(rupees * 100)
    }
    if (d.available !== undefined && d.available !== g.is_available) payload.is_available = d.available
    return Object.keys(payload).length ? [{ id: g.garment_rate_id, name: g.garment_name, payload }] : []
  })
  const invalidPrice = garments.some((g) => {
    const p = drafts[g.garment_rate_id]?.price
    return p !== undefined && (p.trim() === "" || Number.isNaN(parseFloat(p)) || parseFloat(p) < 0)
  })

  const saveAll = async () => {
    setSaving(true)
    const failed: string[] = []
    for (const c of changes) {
      try {
        await updateRate.mutateAsync({ serviceId, garmentTypeId: c.id, payload: c.payload })
      } catch {
        failed.push(c.name)
      }
    }
    setSaving(false)
    if (failed.length) {
      toast.error(`Could not save: ${failed.join(", ")}. The other changes were saved.`)
      setDrafts((d) => Object.fromEntries(Object.entries(d).filter(([id]) => failed.includes(garments.find((g) => g.garment_rate_id === id)?.garment_name ?? ""))))
    } else {
      toast.success(`${changes.length} change${changes.length === 1 ? "" : "s"} saved`)
      setDrafts({})
    }
  }

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2">
        <span className="text-xs text-muted-foreground">
          {changes.length ? `${changes.length} unsaved change${changes.length === 1 ? "" : "s"}` : "Edit prices or availability, then press Save."}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8" disabled={!changes.length || saving} onClick={() => setDrafts({})}>
            Discard
          </Button>
          <Button size="sm" className="h-8" disabled={!changes.length || invalidPrice || saving} onClick={saveAll}>
            {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>

      {garments.map((g) => {
        const d = drafts[g.garment_rate_id]
        const dirty = changes.some((c) => c.id === g.garment_rate_id)
        return (
          <div key={g.garment_rate_id} className={`flex items-center justify-between p-2.5 rounded-lg border bg-background text-sm ${dirty ? "border-brand-500/60" : ""}`}>
            <span className="font-medium">{g.garment_name} <span className="text-muted-foreground font-normal">/ {g.unit}</span></span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">₹</span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={d?.price ?? (g.rate_paise / 100).toFixed(2)}
                className="h-8 w-24"
                onChange={(e) => setDraft(g.garment_rate_id, { price: e.target.value })}
              />
              <Switch
                checked={d?.available ?? g.is_available}
                onCheckedChange={(checked) => setDraft(g.garment_rate_id, { available: checked })}
              />
              <Button variant="ghost" size="sm" className="h-8 px-2 text-danger hover:text-danger" onClick={() => deleteRate.mutate({ serviceId, garmentTypeId: g.garment_rate_id })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )
      })}
      {garments.length === 0 && <p className="text-xs text-muted-foreground py-2">No garment rates yet.</p>}

      <div className="flex items-center gap-2 pt-1">
        <Input placeholder="Garment name (e.g. Shirt)" value={newGarmentName} onChange={(e) => setNewGarmentName(e.target.value)} className="h-8 flex-1" />
        <Input type="number" placeholder="₹ rate" value={newRate} onChange={(e) => setNewRate(e.target.value)} className="h-8 w-24" />
        <Button
          size="sm"
          className="h-8"
          disabled={!newGarmentName.trim() || !newRate || addRate.isPending}
          onClick={() => {
            const rupees = parseFloat(newRate)
            if (Number.isNaN(rupees)) return
            addRate.mutate(
              { serviceId, payload: { garment_type_name: newGarmentName.trim(), rate_paise: Math.round(rupees * 100) } },
              { onSuccess: () => { setNewGarmentName(""); setNewRate("") } }
            )
          }}
        >
          Add
        </Button>
      </div>
    </div>
  )
}

export function VendorServicesTab({ vendorId }: { vendorId: string }) {
  const { data, isLoading, isError } = useVendorServicesAdmin(vendorId)
  const { data: categories } = useVendorCategories()
  const createService = useCreateVendorServiceAdmin(vendorId)
  const updateService = useUpdateVendorServiceAdmin(vendorId)
  const deleteService = useDeleteVendorServiceAdmin(vendorId)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ category_id: "", price: "" })
  const [deleteTarget, setDeleteTarget] = useState<VendorCatalogueService | null>(null)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading services…
        </CardContent>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-semibold">Couldn't load services</p>
        </CardContent>
      </Card>
    )
  }

  function submitAdd() {
    if (!addForm.category_id) return
    createService.mutate(
      {
        category_id: addForm.category_id,
        price_per_piece: addForm.price ? Math.round(parseFloat(addForm.price) * 100) : undefined,
      },
      {
        onSuccess: () => {
          setAddOpen(false)
          setAddForm({ category_id: "", price: "" })
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Services & Rates</CardTitle>
              <CardDescription>{data.total} service(s) in this vendor's catalogue</CardDescription>
            </div>
            <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Add service
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.services.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No services added yet.</p>
          ) : (
            <div className="space-y-2">
              {data.services.map((svc) => {
                const isOpen = expandedId === svc.id
                return (
                  <div key={svc.id} className="rounded-xl border bg-muted/20 overflow-hidden">
                    <div className="flex items-center justify-between p-3 text-sm">
                      <button className="flex items-center gap-2 text-left flex-1" onClick={() => setExpandedId(isOpen ? null : svc.id)}>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        <div>
                          <p className="font-semibold">{svc.name}</p>
                          <p className="text-xs text-muted-foreground">{svc.category_name} · ₹{(svc.price_per_piece / 100).toFixed(2)} base · min {svc.min_weight_kg}kg</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-3">
                        <Badge className={APPROVAL_STYLES[svc.approval_status] ?? "bg-muted text-muted-foreground border-0"}>
                          {svc.approval_status}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <Switch
                            checked={svc.is_available}
                            onCheckedChange={(checked) => updateService.mutate({ serviceId: svc.id, payload: { is_available: checked } })}
                          />
                          <span className="text-xs text-muted-foreground w-14">{svc.is_available ? "Active" : "Hidden"}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-danger hover:text-danger" onClick={() => setDeleteTarget(svc)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="px-3 pb-3 border-t bg-background/50">
                        <GarmentRatesPanel vendorId={vendorId} serviceId={svc.id} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add service */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add service</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={addForm.category_id} onValueChange={(v) => setAddForm((f) => ({ ...f, category_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Base price (₹, optional)</Label>
              <Input type="number" value={addForm.price} onChange={(e) => setAddForm((f) => ({ ...f, price: e.target.value }))} placeholder="e.g. 50" />
            </div>
            <p className="text-xs text-muted-foreground">Garment-level rates can be added once the service is created.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={submitAdd} disabled={!addForm.category_id || createService.isPending}>
              {createService.isPending ? "Adding…" : "Add service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete service confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This removes the service and its garment rates from the vendor's live catalogue.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger hover:bg-danger/90"
              onClick={() => {
                if (deleteTarget) deleteService.mutate(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
