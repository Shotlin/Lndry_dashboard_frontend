import { useCallback } from "react"
import { useAuthStore } from "@/store/auth.store"

const EMPTY_PERMISSIONS: string[] = []

export function usePermissions() {
  const user = useAuthStore((s) => s.user)
  const permissions = user?.permissions ?? EMPTY_PERMISSIONS
  const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN"

  const can = useCallback(
    (permission: string): boolean => {
      if (isSuperAdmin) return true
      return permissions.includes(permission)
    },
    [permissions, isSuperAdmin]
  )

  const canAny = useCallback(
    (...perms: string[]): boolean => {
      if (isSuperAdmin) return true
      return perms.some((p) => permissions.includes(p))
    },
    [permissions, isSuperAdmin]
  )

  const canAll = useCallback(
    (...perms: string[]): boolean => {
      if (isSuperAdmin) return true
      return perms.every((p) => permissions.includes(p))
    },
    [permissions, isSuperAdmin]
  )

  const isViewer =
    !isSuperAdmin &&
    permissions.length > 0 &&
    permissions.every((p) => p.endsWith(".read") || p.endsWith(".view"))

  return { can, canAny, canAll, isViewer, isSuperAdmin, permissions }
}

export function useIsSuperAdmin() {
  const user = useAuthStore((s) => s.user)
  return user?.role === "SUPER_ADMIN" || user?.role === "ADMIN"
}
