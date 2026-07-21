"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useSocket } from "@/components/providers/SocketProvider"

interface NewOrderEvent {
  shop_id?: string | null
}

export function SocketEventBridge(): null {
  const socket = useSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!socket) return

    const handleNewOrder = (event: NewOrderEvent | undefined): void => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-home"] })
    }

    socket.on("new-order", handleNewOrder)
    return () => {
      socket.off("new-order", handleNewOrder)
    }
  }, [socket, queryClient])

  return null
}
