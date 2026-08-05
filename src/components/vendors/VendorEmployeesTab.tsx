"use client"

import { useState } from "react"
import { Loader2, AlertCircle, Plus, KeyRound } from "lucide-react"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
  useVendorStaff,
  useCreateVendorStaff,
  useUpdateVendorStaff,
  useDeactivateVendorStaff,
  useResetVendorStaffPassword,
} from "@/hooks/useVendorStaff"
import { STAFF_ROLES, type StaffRole, type StaffMember } from "@/services/shop-staff.service"

const ROLE_LABELS: Record<StaffRole, string> = {
  VENDOR_OWNER: "Owner",
  VENDOR_STAFF: "Staff",
  VENDOR_RIDER: "Rider",
}

export function VendorEmployeesTab({ vendorId }: { vendorId: string }) {
  const { data, isLoading, isError } = useVendorStaff(vendorId)
  const createStaff = useCreateVendorStaff(vendorId)
  const updateStaff = useUpdateVendorStaff(vendorId)
  const deactivateStaff = useDeactivateVendorStaff(vendorId)
  const resetPassword = useResetVendorStaffPassword(vendorId)

  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "VENDOR_STAFF" as StaffRole })
  const [newTempPassword, setNewTempPassword] = useState<string | null>(null)
  const [resetTempPassword, setResetTempPassword] = useState<string | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<StaffMember | null>(null)

  function submitCreate() {
    createStaff.mutate(
      {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        role: form.role,
      },
      {
        onSuccess: (staff) => {
          setAddOpen(false)
          setForm({ name: "", email: "", phone: "", role: "VENDOR_STAFF" })
          if (staff.temp_password) setNewTempPassword(staff.temp_password)
        },
      }
    )
  }

  const canSubmit = form.name.trim().length > 0 && (form.role === "VENDOR_RIDER" ? form.phone.trim().length > 0 : form.email.trim().length > 0)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading staff…
        </CardContent>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-semibold">Couldn't load staff</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Staff</CardTitle>
              <CardDescription>{data.total} member(s)</CardDescription>
            </div>
            <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Add staff
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.staff.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No staff added yet.</p>
          ) : (
            <div className="space-y-2">
              {data.staff.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                  <div>
                    <p className="text-sm font-semibold">{member.user_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.user_email || member.user_phone || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select
                      value={member.role}
                      onValueChange={(role) => updateStaff.mutate({ staffId: member.id, payload: { role: role as StaffRole } })}
                    >
                      <SelectTrigger className="h-8 w-[110px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAFF_ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="text-xs">
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={member.is_active}
                        onCheckedChange={(checked) => updateStaff.mutate({ staffId: member.id, payload: { is_active: checked } })}
                      />
                      <Badge className={member.is_active ? "bg-success-bg text-success border-0" : "bg-muted text-muted-foreground border-0"}>
                        {member.is_active ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      title="Reset password"
                      disabled={resetPassword.isPending}
                      onClick={() =>
                        resetPassword.mutate(member.id, {
                          onSuccess: (res) => setResetTempPassword(res.temp_password),
                        })
                      }
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-danger hover:text-danger"
                      onClick={() => setDeactivateTarget(member)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add staff */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add staff member</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(role) => setForm((f) => ({ ...f, role: role as StaffRole }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Full name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Staff member's name" />
            </div>
            {form.role === "VENDOR_RIDER" ? (
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Rider logs in via phone OTP" />
              </div>
            ) : (
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="staff@example.com" />
              </div>
            )}
            <p className="text-xs text-muted-foreground">A temporary password will be generated and shown once — share it with the staff member directly.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={submitCreate} disabled={!canSubmit || createStaff.isPending}>
              {createStaff.isPending ? "Adding…" : "Add staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Temp password reveal — new staff */}
      <Dialog open={!!newTempPassword} onOpenChange={(open) => !open && setNewTempPassword(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Staff member added</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Share this temporary password with them now — it won't be shown again.</p>
          <p className="text-2xl font-mono font-bold text-center py-4 bg-muted rounded-lg">{newTempPassword}</p>
        </DialogContent>
      </Dialog>

      {/* Temp password reveal — reset */}
      <Dialog open={!!resetTempPassword} onOpenChange={(open) => !open && setResetTempPassword(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Password reset</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Share this new temporary password with them now — it won't be shown again.</p>
          <p className="text-2xl font-mono font-bold text-center py-4 bg-muted rounded-lg">{resetTempPassword}</p>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirm */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={(open) => !open && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deactivateTarget?.user_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This deactivates their access — it doesn't delete their history. You can re-add them later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger hover:bg-danger/90"
              onClick={() => {
                if (deactivateTarget) deactivateStaff.mutate(deactivateTarget.id)
                setDeactivateTarget(null)
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
