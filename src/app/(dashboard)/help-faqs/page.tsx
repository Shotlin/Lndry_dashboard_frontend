"use client"

import { Suspense, useEffect, useState } from "react"
import { Plus, MoreHorizontal, Pencil, Trash2, CircleQuestionMark, Phone, Mail } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HelpFaqDialog } from "@/components/help-faqs/HelpFaqDialog"
import { useHelpFaqs, useUpdateHelpFaq, useDeleteHelpFaq } from "@/hooks/useHelpFaqs"
import { useSettings, useUpdateSettings } from "@/hooks/useSettings"
import { usePermissions } from "@/hooks/usePermissions"
import type { HelpFaq } from "@/types"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Support phone/email — the numbers behind "Call Us" / "Email Support" in the customer app. */
function SupportContactCard({ canManage }: { canManage: boolean }) {
  const { data: settings, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()

  const savedPhone = String(settings?.support_phone?.value ?? "")
  const savedEmail = String(settings?.support_email?.value ?? "")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    setPhone(savedPhone)
    setEmail(savedEmail)
  }, [savedPhone, savedEmail])

  const emailInvalid = email.trim() !== "" && !EMAIL_RE.test(email.trim())
  const dirty = phone.trim() !== savedPhone || email.trim() !== savedEmail
  const canSave = canManage && dirty && phone.trim() !== "" && email.trim() !== "" && !emailInvalid

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Support contact</h2>
        <p className="text-sm text-muted-foreground">
          Customers reach these from Help &amp; FAQs. &quot;Call Us&quot; dials the phone number and
          &quot;Email Support&quot; opens an email to the address — changes apply in the app immediately.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="support-phone" className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> Support phone number
          </Label>
          <Input
            id="support-phone"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isLoading || !canManage}
            maxLength={30}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="support-email" className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Support email address
          </Label>
          <Input
            id="support-email"
            type="email"
            placeholder="support@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || !canManage}
            maxLength={100}
          />
          {emailInvalid && <p className="text-xs text-destructive">Enter a valid email address.</p>}
        </div>
      </div>

      {canManage && (
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={!canSave || updateSettings.isPending}
            onClick={() =>
              updateSettings.mutate({ support_phone: phone.trim(), support_email: email.trim() })
            }
          >
            {updateSettings.isPending ? "Saving..." : "Save contact details"}
          </Button>
        </div>
      )}
    </div>
  )
}

function HelpFaqsContent() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<HelpFaq | null>(null)

  const { data: faqs, isLoading } = useHelpFaqs()
  const toggleMutation = useUpdateHelpFaq({ silent: true })
  const deleteMutation = useDeleteHelpFaq()
  const { can } = usePermissions()
  const canManage = can("settings.write")

  const nextSortOrder = (faqs?.reduce((max, f) => Math.max(max, f.sortOrder), 0) ?? 0) + 10

  const openCreate = () => {
    setEditingFaq(null)
    setDialogOpen(true)
  }

  const openEdit = (faq: HelpFaq) => {
    setEditingFaq(faq)
    setDialogOpen(true)
  }

  const handleDelete = (faq: HelpFaq) => {
    if (confirm(`Delete this FAQ?\n\n"${faq.question}"\n\nIt will disappear from the app for every customer.`)) {
      deleteMutation.mutate(faq.id)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & FAQs"
        subtitle="What customers see under Profile → Help & FAQs in the app. Changes go live without an app update."
      >
        {canManage && (
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> Add FAQ
          </Button>
        )}
      </PageHeader>

      <SupportContactCard canManage={canManage} />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead className="hidden md:table-cell">Answer</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Shown in app</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !faqs || faqs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    icon={<CircleQuestionMark className="h-6 w-6 text-muted-foreground" />}
                    title="No FAQs yet"
                    description="Customers will see an empty Help screen until you add some"
                  />
                </TableCell>
              </TableRow>
            ) : (
              faqs.map((faq) => (
                <TableRow key={faq.id}>
                  <TableCell className="font-medium max-w-[280px]">{faq.question}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[380px] truncate">
                    {faq.answer}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{faq.sortOrder}</TableCell>
                  <TableCell>
                    {canManage ? (
                      <Switch
                        checked={faq.isActive}
                        disabled={toggleMutation.isPending}
                        onCheckedChange={(v) =>
                          toggleMutation.mutate({ id: faq.id, payload: { isActive: v } })
                        }
                        aria-label={`Show "${faq.question}" in the app`}
                      />
                    ) : (
                      <Badge variant={faq.isActive ? "default" : "outline"}>
                        {faq.isActive ? "Visible" : "Hidden"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {canManage ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(faq)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(faq)}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <HelpFaqDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        faq={editingFaq}
        nextSortOrder={nextSortOrder}
      />
    </div>
  )
}

export default function HelpFaqsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="table" />}>
      <HelpFaqsContent />
    </Suspense>
  )
}
