import api from "@/lib/api"
import type { ApiResponse } from "@/types"

export type TicketStatus = "OPEN" | "REPLIED" | "CLOSED"

export interface SupportTicket {
  id: string
  vendor_id: string
  vendor_name: string
  ticket_ref: string
  title: string
  description: string
  category: string
  status: TicketStatus
  priority: string
  admin_reply: string | null
  replied_at: string | null
  vendor_reply: string | null
  vendor_replied_at: string | null
  rating: number | null
  rated_at: string | null
  created_at: string
  updated_at: string
}

export const supportTicketsService = {
  async getAll(status?: TicketStatus): Promise<SupportTicket[]> {
    const { data } = await api.get<ApiResponse<SupportTicket[]>>("/admin/support-tickets", {
      params: { status, limit: 100 },
    })
    return data.data ?? []
  },

  async reply(ticketId: string, reply: string): Promise<SupportTicket> {
    const { data } = await api.post<ApiResponse<SupportTicket>>(
      `/admin/support-tickets/${ticketId}/reply`,
      { reply }
    )
    return data.data
  },

  async close(ticketId: string): Promise<SupportTicket> {
    const { data } = await api.post<ApiResponse<SupportTicket>>(
      `/admin/support-tickets/${ticketId}/close`
    )
    return data.data
  },
}
