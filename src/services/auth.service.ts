import api from "@/lib/api"
import type { ApiResponse, AdminUser } from "@/types"
import { translatePermissions } from "@/lib/permissions"

export interface LoginResponseData {
  accessToken: string
  user: AdminUser
  requires2FA?: boolean
}

export interface MeResponse {
  user: AdminUser
  permissions: string[]
}

/**
 * Log in with email and password and return the auth payload.
 * If 2FA is required, requires2FA will be true and the user will need to
 * complete TOTP verification using verify2FA().
 */
export async function loginAdmin(
  email: string,
  password: string,
): Promise<LoginResponseData> {
  const { data } = await api.post<ApiResponse<LoginResponseData>>(
    "/admin/auth/login",
    { email, password },
  )
  const role = data.data.user.platform_role || data.data.user.role
  const mappedPerms = translatePermissions(data.data.user.permissions || [], role)
  return {
    ...data.data,
    user: {
      ...data.data.user,
      name: data.data.user.name || data.data.user.full_name || "Admin",
      permissions: mappedPerms,
    },
  }
}

/**
 * Verify the TOTP challenge post-login to establish the final authenticated session.
 */
export async function verify2FA(code: string): Promise<LoginResponseData> {
  const { data } = await api.post<ApiResponse<LoginResponseData>>(
    "/admin/auth/verify-2fa",
    { code },
  )
  const role = data.data.user.platform_role || data.data.user.role
  const mappedPerms = translatePermissions(data.data.user.permissions || [], role)
  return {
    ...data.data,
    user: {
      ...data.data.user,
      permissions: mappedPerms,
    },
  }
}

/**
 * Obtain a short-lived step-up token for high-risk operations using the user's TOTP.
 */
export async function getStepUpToken(totpCode: string): Promise<string> {
  const { data } = await api.post<ApiResponse<{ token: string }>>(
    "/admin/auth/step-up",
    { totp_code: totpCode },
  )
  return data.data.token
}

/**
 * Fetch the authenticated user's profile and permissions list.
 */
export async function me(): Promise<MeResponse> {
  const { data } = await api.get<ApiResponse<{ user: AdminUser; permissions?: string[] }>>(
    "/admin/auth/me",
  )
  const role = data.data.user.platform_role || data.data.user.role
  const mappedPerms = translatePermissions(data.data.permissions ?? [], role)
  return {
    user: {
      ...data.data.user,
      permissions: mappedPerms,
    },
    permissions: mappedPerms,
  }
}

/**
 * Validate the current session token and return the user profile.
 */
export async function validateSession(): Promise<AdminUser> {
  const data = await me()
  return {
    ...data.user,
    name: data.user.name || data.user.full_name || "Admin",
    permissions: data.permissions,
  }
}

/**
 * Log out the administrator.
 */
export async function logoutAdmin(): Promise<void> {
  try {
    await api.post("/admin/auth/logout")
  } catch {
    // Ignore errors — local state is cleared regardless.
  }
}

/**
 * Force password rotation.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await api.post("/admin/auth/change-password", { currentPassword, newPassword })
}


