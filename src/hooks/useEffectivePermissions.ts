"use client"

import { useMemo } from "react"
import { useAuthStore } from "@/store/auth.store"
import { type Role } from "@/lib/permissions"

export interface EffectivePermissions {
  permissions: readonly string[]
  has: (permission: string) => boolean
  hasAny: (...permissions: string[]) => boolean
  hasAll: (...permissions: string[]) => boolean
  isViewer: boolean
  role: Role
}

export function useEffectivePermissions(): EffectivePermissions {
  const user = useAuthStore((s) => s.user)
  const userRole = user?.role as Role
  const userPermissions = user?.permissions ?? []
  const isSuperAdmin = userRole === "SUPER_ADMIN"

  return useMemo(() => {
    const has = (permission: string): boolean => {
      if (isSuperAdmin) return true
      return userPermissions.includes(permission)
    }

    const hasAny = (...perms: string[]): boolean => {
      if (isSuperAdmin) return true
      return perms.some((p) => userPermissions.includes(p))
    }

    const hasAll = (...perms: string[]): boolean => {
      if (isSuperAdmin) return true
      return perms.every((p) => userPermissions.includes(p))
    }

    const isViewer =
      !isSuperAdmin &&
      userPermissions.length > 0 &&
      userPermissions.every((p) => p.endsWith(".read") || p.endsWith(".view"))

    return {
      permissions: userPermissions,
      has,
      hasAny,
      hasAll,
      isViewer,
      role: userRole || "ADMIN_EMPLOYEE",
    }
  }, [userRole, userPermissions, isSuperAdmin])
}
