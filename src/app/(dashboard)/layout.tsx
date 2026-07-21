"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/layout/Sidebar"
import { KeyboardShortcutsSheet } from "@/components/layout/KeyboardShortcutsSheet"
import { SocketEventBridge } from "@/components/layout/socket-event-bridge"
import { SocketProvider } from "@/components/providers/SocketProvider"
import { ErrorBoundary } from "@/components/shared/error-boundary"
import { ViewerBanner } from "@/components/shared/PermissionGate"
import { StepUpDialog } from "@/components/shared/StepUpDialog"
import { useAuthStore } from "@/store/auth.store"
import { useSidebarStore } from "@/store/sidebar.store"
import { validateSession } from "@/services/auth.service"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isHydrated, hydrate, login, clearAuth } = useAuthStore()
  const isCollapsed = useSidebarStore((s) => s.isCollapsed)
  const isBuilderRoute = pathname === "/themes/builder"
  const [isValidating, setIsValidating] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  // Session validation helper with built-in 5-second timeout
  const runValidation = () => {
    setApiError(null)
    setIsValidating(true)

    const hasSessionCookie = typeof document !== "undefined" && document.cookie.includes("auth_session=1")
    if (!hasSessionCookie) {
      clearAuth()
      setIsValidating(false)
      router.replace("/login")
      return
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout")), 5000)
    })

    Promise.race([validateSession(), timeoutPromise])
      .then((adminUser) => {
        const token = useAuthStore.getState().accessToken || ""
        login(adminUser, token)
        setIsValidating(false)
      })
      .catch((err: any) => {
        console.error("[Layout] Session validation error:", err)
        const isAuthError = err.response?.status === 401
        
        if (isAuthError) {
          clearAuth()
          setIsValidating(false)
          router.replace("/login")
        } else {
          // Network Error or Timeout
          setApiError(err.message || "Unable to connect to server")
          setIsValidating(false)
        }
      })
  }

  // Step 1: Hydrate auth from localStorage on mount
  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Prefetch frequent routes to optimize navigation performance
  useEffect(() => {
    router.prefetch("/dashboard")
    router.prefetch("/reports")
    router.prefetch("/audit-logs")
    router.prefetch("/vendors")
    router.prefetch("/customers")
    router.prefetch("/orders")
    router.prefetch("/exceptions")
  }, [router])

  // Step 2: After hydration, validate token against backend
  useEffect(() => {
    if (!isHydrated) return
    runValidation()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated])

  // If the backend is unreachable or request timed out, show error fallback
  if (apiError) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--surface-bg)]">
        <div className="flex flex-col items-center text-center p-6 max-w-sm lndry-card shadow-lg border border-[#e8e8ef] rounded-2xl bg-white">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-[#080f14]">Unable to connect to server</h2>
          <p className="text-xs text-[#7e8998] mt-2 mb-6">
            {apiError === "Timeout"
              ? "The connection timed out. Please check that the server is running."
              : "Could not reach the operations backend API. Please check your network connection."}
          </p>
          <Button
            onClick={runValidation}
            className="w-full bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white font-semibold rounded-full h-11 px-5 text-[13px] shadow-sm flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            Retry connection
          </Button>
        </div>
      </div>
    )
  }

  // Show loading spinner while validating
  if (!isHydrated || isValidating) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#f7f7fb]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-20 w-20 rounded-2xl bg-white p-2 shadow-sm border border-[#e8e8ef] overflow-hidden flex items-center justify-center animate-pulse">
            <img
              src="/lndry-assets/logos/brand-logo.jpg"
              className="h-full w-full object-contain"
              alt="LNDRY Logo"
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent" />
            <p className="text-sm font-semibold text-[#64748b]">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // If not authenticated after validation, show nothing (redirect to /login is underway)
  if (!isAuthenticated) {
    return null
  }

  return (
    <SocketProvider>
      <SocketEventBridge />
      <StepUpDialog />
      <KeyboardShortcutsSheet />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      {isBuilderRoute ? (
        <main
          id="main-content"
          aria-label="Dashboard content"
          className="h-screen overflow-hidden"
        >
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      ) : (
        <>
          <div className="hidden md:block">
            <Sidebar />
          </div>

          <div
            className={cn(
              "min-h-screen bg-[#f7f7fb] transition-all duration-200 relative",
              isCollapsed ? "md:ml-[72px]" : "md:ml-[244px]"
            )}
          >
            {/* Decorative top-right gradient matching mockup */}
            <div className="page-gradient-decoration" />
            <main
              id="main-content"
              aria-label="Dashboard content"
              className="relative min-h-screen px-[34px] py-[41px] z-[1]"
            >
              <ErrorBoundary>
                <ViewerBanner />
                {children}
              </ErrorBoundary>
            </main>
          </div>
        </>
      )}
    </SocketProvider>
  )
}
