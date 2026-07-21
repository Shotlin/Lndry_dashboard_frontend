import axios, { AxiosError, type AxiosResponseHeaders, type RawAxiosResponseHeaders } from "axios"
import { toast } from "sonner"

import { useAuthStore } from "@/store/auth.store"
import { getQueryClient } from "@/lib/queryClient"
import { t } from "@/lib/i18n"
import { triggerSubmitCooldown } from "@/lib/submit-cooldown"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 15000,
})

// ─────────────────────────────────────────────────────────────────────────────
// Request interceptor — JWT injection, RBAC viewer guard
// ─────────────────────────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // ── RBAC: Block all mutations for Viewer users ──
    const method = (config.method || "get").toLowerCase()
    const isMutation = ["post", "put", "patch", "delete"].includes(method)
    const url = config.url || ""

    // Allow auth routes (login, me, logout) to pass through
    const isAuthRoute =
      url.includes("/auth/login") ||
      url.includes("/auth/me") ||
      url.includes("/auth/logout")

    if (isMutation && !isAuthRoute) {
      try {
        const user = useAuthStore.getState().user
        if (user) {
          const permissions: string[] = user.permissions || []

          // Check if user only has view permissions (Viewer role)
          const isViewer =
            permissions.length > 0 &&
            permissions.every((p: string) => p.endsWith(".view"))

          if (isViewer) {
            toast.error("Access denied — you have view-only permissions", {
              description: "Contact a Super Admin to request edit access.",
            })
            // Cancel the request by returning a rejected promise
            const cancelSource = axios.CancelToken.source()
            config.cancelToken = cancelSource.token
            cancelSource.cancel("VIEWER_BLOCKED")
            return config
          }
        }
      } catch {
        // If checks fail, let the request through (safety)
      }
    }
  }
  return config
})

// ─────────────────────────────────────────────────────────────────────────────
// Response interceptor — 401 / 403 / 429 / 5xx handling
// ─────────────────────────────────────────────────────────────────────────────

/** Pull the `x-request-id` header out of an axios error in a header-shape-agnostic way. */
function readRequestId(
  headers: RawAxiosResponseHeaders | AxiosResponseHeaders | undefined,
): string | undefined {
  if (!headers) return undefined
  const direct = (headers as Record<string, unknown>)["x-request-id"]
  if (typeof direct === "string" && direct.length > 0) return direct
  const maybeGet = (headers as { get?: (k: string) => unknown }).get
  if (typeof maybeGet === "function") {
    const v = maybeGet.call(headers, "x-request-id")
    if (typeof v === "string" && v.length > 0) return v
  }
  return undefined
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ code?: string; message?: string }>) => {
    // Don't show errors for cancelled requests (Viewer blocks)
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    const status = error.response?.status
    const code = error.response?.data?.code
    const url = error.config?.url || ""

    if (typeof window === "undefined") {
      return Promise.reject(error)
    }

    const onLoginPage = window.location.pathname === "/login"
    const isAuthMe = url.includes("/auth/me")
    const isAuthLogin = url.includes("/auth/login")

    // ── 401 unauthorized ──────────────────────────────────────────────
    // Clear auth + query cache and bounce to /login.
    if (status === 401 && !isAuthMe && !isAuthLogin && !onLoginPage) {
      useAuthStore.getState().clearAuth()
      // Clear residual cookies left by older sessions.
      document.cookie = "auth_session=; path=/; max-age=0"
      document.cookie = "accessToken=; path=/; max-age=0"
      document.cookie = "mfa_pending=; path=/; max-age=0"
      document.cookie = "password_change_required=; path=/; max-age=0"
      try {
        getQueryClient().clear()
      } catch {
        // Defensive
      }
      window.location.href = "/login"
      return Promise.reject(error)
    }

    // ── 403 STEP_UP_REQUIRED ──────────────────────────────────────────
    // Initiates the step-up TOTP verification dialog and retries
    if (status === 403 && code === "STEP_UP_REQUIRED") {
      if (error.config?.headers?.["x-step-up-token"] || (error.config as any)?._retry) {
        return Promise.reject(error)
      }
      ;(error.config as any)._retry = true

      return new Promise((resolve, reject) => {
        const setStepUpChallenge = useAuthStore.getState().setStepUpChallenge
        setStepUpChallenge(
          (token: string) => {
            if (!error.config) {
              reject(error)
              return
            }
            error.config.headers = error.config.headers || {}
            error.config.headers["x-step-up-token"] = token
            resolve(api(error.config))
          },
          () => {
            reject(error)
          }
        )
      })
    }

    // ── 403 PERMISSION_DENIED ─────────────────────────────────────────
    if (status === 403 && code === "PERMISSION_DENIED") {
      toast.error(t("errors.permissionDenied"), {
        description: error.response?.data?.message,
      })
      return Promise.reject(error)
    }

    // ── 403 PASSWORD_CHANGE_REQUIRED ──────────────────────────────────
    if (status === 403 && code === "PASSWORD_CHANGE_REQUIRED") {
      if (window.location.pathname !== "/change-password") {
        window.location.href = "/change-password"
      }
      return Promise.reject(error)
    }

    // ── 429 rate limited ──────────────────────────────────────────────
    if (status === 429) {
      toast.error(t("errors.tooManyRequests"))
      triggerSubmitCooldown(5000)
      return Promise.reject(error)
    }

    // ── 5xx server errors ─────────────────────────────────────────────
    if (typeof status === "number" && status >= 500) {
      const requestId = readRequestId(error.response?.headers)
      toast.error(t("errors.genericError"), {
        description: requestId ? `Error id: ${requestId}` : undefined,
        action: requestId
          ? {
              label: t("errors.copyErrorId"),
              onClick: () => {
                navigator.clipboard
                  ?.writeText(requestId)
                  .then(() => {
                    toast.success(t("errors.errorIdCopied"))
                  })
                  .catch(() => {
                    /* no-op */
                  })
              },
            }
          : undefined,
      })
      return Promise.reject(error)
    }

    return Promise.reject(error)
  },
)

export default api
