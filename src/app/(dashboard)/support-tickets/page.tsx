"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, MessageCircleQuestion, Star } from "lucide-react"
import { toast } from "sonner"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  supportTicketsService,
  type SupportTicket,
  type TicketStatus,
} from "@/services/support-tickets.service"

function StatusBadge({ status }: { status: TicketStatus }) {
  if (status === "OPEN") {
    return <Badge className="bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEF2F2]">Open</Badge>
  }
  if (status === "REPLIED") {
    return <Badge className="bg-[#FEF3C7] text-[#B45309] hover:bg-[#FEF3C7]">Replied</Badge>
  }
  return <Badge className="bg-[#ECFDF5] text-[#047857] hover:bg-[#ECFDF5]">Closed</Badge>
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  )
}

function TicketCard({ ticket }: { ticket: SupportTicket }) {
  const queryClient = useQueryClient()
  const [reply, setReply] = useState("")

  const replyMutation = useMutation({
    mutationFn: (text: string) => supportTicketsService.reply(ticket.id, text),
    onSuccess: () => {
      toast.success(`Reply sent — ${ticket.vendor_name} will see it in their app`)
      setReply("")
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] })
    },
    onError: () => toast.error("Failed to send reply"),
  })

  const closeMutation = useMutation({
    mutationFn: () => supportTicketsService.close(ticket.id),
    onSuccess: () => {
      toast.success("Ticket closed")
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] })
    },
    onError: () => toast.error("Failed to close ticket"),
  })

  const showVendorFollowUp =
    ticket.vendor_reply &&
    ticket.vendor_replied_at &&
    (!ticket.replied_at || new Date(ticket.vendor_replied_at) > new Date(ticket.replied_at))

  return (
    <div className="lndry-card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-bold text-[#080f14]">{ticket.title}</h3>
            <StatusBadge status={ticket.status} />
          </div>
          <p className="text-[12px] text-[#7e8998] mt-0.5">
            {ticket.ticket_ref} · {ticket.vendor_name} · {ticket.category}
          </p>
        </div>
        {ticket.status !== "CLOSED" && (
          <Button
            size="sm"
            variant="outline"
            disabled={closeMutation.isPending}
            onClick={() => closeMutation.mutate()}
          >
            {closeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Close Ticket
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-[#e8e8ef] p-3 space-y-2">
        <p className="text-[13px] text-[#334155]">{ticket.description}</p>
        {ticket.admin_reply && (
          <div className="rounded-md bg-[#EEF2FF] p-2.5">
            <p className="text-[11px] font-bold text-[#6366F1] mb-0.5">Your reply</p>
            <p className="text-[13px] text-[#334155]">{ticket.admin_reply}</p>
          </div>
        )}
        {showVendorFollowUp && (
          <div className="rounded-md bg-[#F8FAFC] p-2.5">
            <p className="text-[11px] font-bold text-[#7e8998] mb-0.5">Vendor's follow-up</p>
            <p className="text-[13px] text-[#334155]">{ticket.vendor_reply}</p>
          </div>
        )}
        {ticket.rating != null && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-[#7e8998]">Vendor satisfaction:</span>
            <StarDisplay rating={ticket.rating} />
          </div>
        )}
      </div>

      {ticket.status !== "CLOSED" && (
        <div className="space-y-2">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply to the vendor..."
            rows={3}
            className="text-[13px]"
          />
          <Button
            size="sm"
            disabled={reply.trim().length < 3 || replyMutation.isPending}
            onClick={() => replyMutation.mutate(reply)}
          >
            {replyMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Send Reply
          </Button>
        </div>
      )}
    </div>
  )
}

export default function SupportTicketsPage() {
  const [tab, setTab] = useState<TicketStatus>("OPEN")

  const { data, isLoading, error } = useQuery({
    queryKey: ["support-tickets", tab],
    queryFn: () => supportTicketsService.getAll(tab),
    staleTime: 15 * 1000,
  })

  const tickets = data ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        title="Support Tickets"
        subtitle="Vendor support requests — reply, close, and see satisfaction ratings."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TicketStatus)}>
        <TabsList>
          <TabsTrigger value="OPEN">Open</TabsTrigger>
          <TabsTrigger value="REPLIED">Replied</TabsTrigger>
          <TabsTrigger value="CLOSED">Closed</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : error ? (
        <div className="lndry-card">
          <p className="text-sm text-red-600">Failed to load support tickets.</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="lndry-card">
          <EmptyState
            icon={<MessageCircleQuestion className="h-6 w-6 text-muted-foreground" />}
            title={`No ${tab.toLowerCase()} tickets`}
            description="Vendor support requests will show up here."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  )
}
