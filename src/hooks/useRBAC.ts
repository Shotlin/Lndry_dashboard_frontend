import { useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getTeamMembers,
  inviteMember,
  updateMember,
  removeMember,
} from "@/services/rbac.service"
import type {
  CreateRolePayload,
  UpdateRolePayload,
  InviteMemberPayload,
  UpdateMemberPayload,
} from "@/types/rbac.types"
import { useAuthStore } from "@/store/auth.store"
import {
  findRouteGuard,
  isMenuItemAllowed,
  primaryEntityFor,
  satisfies,
  type PermissionSubject,
  type Role,
  type RouteGuard,
} from "@/lib/permissions"

/* ── Roles ── */

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => createRole(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] })
      toast.success("Role created")
    },
    onError: () => toast.error("Failed to create role"),
  })
}

export function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: string; payload: UpdateRolePayload }) =>
      updateRole(roleId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] })
      toast.success("Role updated")
    },
    onError: () => toast.error("Failed to update role"),
  })
}

export function useDeleteRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roleId: string) => deleteRole(roleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] })
      toast.success("Role deleted")
    },
    onError: () => toast.error("Failed to delete role"),
  })
}

/* ── Team Members ── */

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team", "members"] as const,
    queryFn: getTeamMembers,
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useInviteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: InviteMemberPayload) => inviteMember(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] })
      toast.success("Team member invited")
    },
    onError: () => toast.error("Failed to invite member"),
  })
}

export function useUpdateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, payload }: { memberId: string; payload: UpdateMemberPayload }) =>
      updateMember(memberId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] })
      toast.success("Member updated")
    },
    onError: () => toast.error("Failed to update member"),
  })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => removeMember(memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] })
      toast.success("Member removed")
    },
    onError: () => toast.error("Failed to remove member"),
  })
}

/* ── Route & Menu RBAC ── */

function normalizeRole(raw: string | null | undefined): Role {
  if (!raw) return "ADMIN_EMPLOYEE"
  if (raw === "SUPER_ADMIN") return "SUPER_ADMIN"
  if (raw === "ADMIN") return "ADMIN"
  if (raw === "FINANCE_ADMIN") return "FINANCE_ADMIN"
  return "ADMIN_EMPLOYEE"
}

function useRBACSubject(): PermissionSubject {
  // HQ accounts keep the legacy database role (`ADMIN`) while the canonical
  // dashboard role is supplied separately as `platform_role`.
  const role = useAuthStore((s) => s.user?.platform_role ?? s.user?.role)
  const userPerms = useAuthStore((s) => s.user?.permissions) || []

  return useMemo(() => {
    return {
      role: normalizeRole(role),
      permissions: userPerms,
    }
  }, [role, userPerms])
}

export interface RouteRBAC {
  isAuthorized: boolean
  canRead: boolean
  canWrite: boolean
  requiresActiveShop: boolean
  superAdminOnly: boolean
  guard: RouteGuard | null
}

export function useRouteRBAC(pattern: string | RouteGuard): RouteRBAC {
  const subject = useRBACSubject()

  return useMemo<RouteRBAC>(() => {
    const guard: RouteGuard | null =
      typeof pattern === "string" ? findRouteGuard(pattern) : pattern

    if (!guard) {
      return {
        isAuthorized: true,
        canRead: false,
        canWrite: false,
        requiresActiveShop: false,
        superAdminOnly: false,
        guard: null,
      }
    }

    const isAuthorized = satisfies(subject, guard)
    const isSuperAdmin = subject.role === "SUPER_ADMIN" || subject.role === "ADMIN"

    const entity = primaryEntityFor(guard)
    const canRead = entity
      ? subject.permissions.some(
          (p) => p === `${entity}.read` || p.startsWith(`${entity}.read.`),
        )
      : isSuperAdmin
    const canWrite = entity
      ? subject.permissions.some(
          (p) =>
            p === `${entity}.write` ||
            p === `${entity}.delete` ||
            p === `${entity}.override` ||
            p === `${entity}.assign` ||
            p === `${entity}.suspend` ||
            p === `${entity}.approve` ||
            p === `${entity}.review`,
        )
      : false

    return {
      isAuthorized,
      canRead,
      canWrite,
      requiresActiveShop: false,
      superAdminOnly: Boolean(guard.superAdminOnly),
      guard,
    }
  }, [pattern, subject])
}

export function useMenuRBAC(itemId: string): boolean {
  const subject = useRBACSubject()

  return useMemo(
    () => isMenuItemAllowed(itemId, subject),
    [itemId, subject],
  )
}

export function useMenuVisibility(
  ids: readonly string[],
): Record<string, boolean> {
  const subject = useRBACSubject()

  return useMemo(() => {
    const out: Record<string, boolean> = {}
    for (const id of ids) {
      out[id] = isMenuItemAllowed(id, subject)
    }
    return out
  }, [ids, subject])
}
