"use client"

import { useCallback } from "react"
import { useAuthStore } from "@/store/auth.store"
import { getQueryClient } from "@/lib/queryClient"
import { disconnectSocket } from "@/lib/socket-registry"

export function useLogout() {
  const logout = useCallback(() => {
    useAuthStore.getState().logout()
  }, [])

  return { logout }
}

export function performLogout(): void {
  try {
    getQueryClient().clear()
  } catch {
    // Swallow — may not be available in all contexts
  }

  try {
    disconnectSocket()
  } catch {
    // Defensive
  }

  if (typeof window === "undefined") return
  try {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("admin-user")
  } catch {
    // Defensive — storage may be unavailable
  }

  if (typeof document !== "undefined") {
    try {
      document.cookie = "auth_session=; path=/; max-age=0; samesite=lax"
      document.cookie = "accessToken=; path=/; max-age=0; samesite=lax"
      document.cookie = "is-super-admin=; path=/; max-age=0; samesite=lax"
    } catch {
      // Defensive
    }
  }

  try {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrated: true,
    })
  } catch {
    // Defensive
  }

  window.location.href = "/login"
}
