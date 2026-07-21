import { create } from "zustand"
import type { AdminUser } from "@/types"
import { getQueryClient } from "@/lib/queryClient"
import { disconnectSocket } from "@/lib/socket-registry"

const TWENTY_DAYS_SECONDS = 20 * 24 * 60 * 60 // 1,728,000

interface AuthState {
  user: AdminUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isHydrated: boolean
  
  // MFA / 2FA status
  mfaPending: boolean
  
  // Step-up challenge callback refs
  stepUpChallenge: ((token: string) => void) | null
  stepUpCancel: (() => void) | null
  
  // Actions
  login: (user: AdminUser, token: string, requires2FA?: boolean) => void
  logout: () => void
  hydrate: () => void
  clearAuth: () => void
  setMfaPending: (pending: boolean) => void
  setStepUpChallenge: (
    challenge: ((token: string) => void) | null,
    cancel: (() => void) | null
  ) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isHydrated: false,
  mfaPending: false,
  stepUpChallenge: null,
  stepUpCancel: null,

  login: (user, token, requires2FA = false) => {
    // Set session cookie for Next.js middleware
    document.cookie = `auth_session=1; path=/; max-age=${TWENTY_DAYS_SECONDS}; samesite=lax`
    
    if (requires2FA) {
      document.cookie = `mfa_pending=1; path=/; max-age=${TWENTY_DAYS_SECONDS}; samesite=lax`
      document.cookie = `password_change_required=; path=/; max-age=0; samesite=lax`
      set({
        user,
        accessToken: token,
        isAuthenticated: true,
        mfaPending: true,
        isHydrated: true,
      })
    } else {
      document.cookie = `mfa_pending=; path=/; max-age=0; samesite=lax`
      if (user.force_password_change) {
        document.cookie = `password_change_required=1; path=/; max-age=${TWENTY_DAYS_SECONDS}; samesite=lax`
      } else {
        document.cookie = `password_change_required=; path=/; max-age=0; samesite=lax`
      }
      set({
        user,
        accessToken: token,
        isAuthenticated: true,
        mfaPending: false,
        isHydrated: true,
      })
    }
  },

  logout: () => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    
    // Clear cookies
    document.cookie = "auth_session=; path=/; max-age=0; samesite=lax"
    document.cookie = "accessToken=; path=/; max-age=0; samesite=lax"
    document.cookie = "mfa_pending=; path=/; max-age=0; samesite=lax"
    document.cookie = "password_change_required=; path=/; max-age=0; samesite=lax"
    
    try {
      getQueryClient().clear()
    } catch {
      // Defensive
    }
    
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      mfaPending: false,
      stepUpChallenge: null,
      stepUpCancel: null,
      isHydrated: true,
    })
    
    disconnectSocket()
    window.location.href = "/login"
  },

  clearAuth: () => {
    document.cookie = "auth_session=; path=/; max-age=0; samesite=lax"
    document.cookie = "accessToken=; path=/; max-age=0; samesite=lax"
    document.cookie = "mfa_pending=; path=/; max-age=0; samesite=lax"
    document.cookie = "password_change_required=; path=/; max-age=0; samesite=lax"
    
    disconnectSocket()
    
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      mfaPending: false,
      stepUpChallenge: null,
      stepUpCancel: null,
      isHydrated: true,
    })
  },

  hydrate: () => {
    if (typeof window === "undefined") return
    
    const cookies = typeof document !== "undefined" ? document.cookie : ""
    const hasSessionCookie = cookies.includes("auth_session=1")
    const isMfaCookiePending = cookies.includes("mfa_pending=1")
    
    if (hasSessionCookie) {
      // We have a session marker; wait for layout to validate
      set({
        isAuthenticated: true,
        mfaPending: isMfaCookiePending,
        isHydrated: true,
      })
    } else {
      set({
        isAuthenticated: false,
        isHydrated: true,
      })
    }
  },

  setMfaPending: (pending) => {
    if (pending) {
      document.cookie = `mfa_pending=1; path=/; max-age=${TWENTY_DAYS_SECONDS}; samesite=lax`
    } else {
      document.cookie = `mfa_pending=; path=/; max-age=0; samesite=lax`
    }
    set({ mfaPending: pending })
  },

  setStepUpChallenge: (challenge, cancel) => {
    set({ stepUpChallenge: challenge, stepUpCancel: cancel })
  },
}))
