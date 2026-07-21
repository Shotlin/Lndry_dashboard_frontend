"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { loginAdmin, validateSession } from "@/services/auth.service"
import { useAuthStore } from "@/store/auth.store"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginForm = z.infer<typeof loginSchema>

function LoginPageFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#6366F1] border-t-transparent" />
        <p className="text-sm text-[#64748b]">Checking session...</p>
      </div>
    </div>
  )
}

function resolveRedirectTarget(raw: string | null): string {
  if (!raw) return "/dashboard"
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard"
  return raw
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clearAuth, login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [checkingSession, setCheckingSession] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    const hasSessionCookie = typeof document !== "undefined" && document.cookie.includes("auth_session=1")
    if (!hasSessionCookie) {
      clearAuth()
      setCheckingSession(false)
      return
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout")), 5000)
    })

    Promise.race([validateSession(), timeoutPromise])
      .then((adminUser) => {
        // Pass the token from Zustand memory (or empty string if we rely solely on cookies)
        const token = useAuthStore.getState().accessToken || ""
        login(adminUser, token, false)
        const redirect = resolveRedirectTarget(searchParams.get("redirect"))
        router.replace(redirect)
      })
      .catch(() => {
        clearAuth()
        setCheckingSession(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(values: LoginForm) {
    try {
      const data = await loginAdmin(values.email, values.password)
      const redirect = resolveRedirectTarget(searchParams.get("redirect"))
      
      if (data.requires2FA) {
        login(data.user, data.accessToken, true)
        toast.info("Two-factor authentication is required. Please verify.")
        router.push(`/login/verify-2fa?redirect=${encodeURIComponent(redirect)}`)
      } else {
        login(data.user, data.accessToken, false)
        toast.success(`Welcome back, ${data.user.name || "Admin"}!`)
        router.push(redirect)
      }
    } catch (err: unknown) {
      setAttempts((a) => a + 1)
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Login failed. Check your credentials."
      toast.error(message)
    }
  }

  if (checkingSession) {
    return <LoginPageFallback />
  }

  return (
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2 h-screen overflow-hidden">
      {/* Left side: Aqua branded panel — exact match to admin-login-v1.png */}
      <div className="bg-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#4F46E5] text-white p-16 flex-col justify-between hidden md:flex">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-white p-1.5 flex items-center justify-center overflow-hidden shadow-sm">
            <img
              src="/lndry-assets/logos/brand-logo.jpg"
              className="h-full w-full object-contain"
              alt="LNDRY"
            />
          </div>
          <span className="text-[18px] font-black tracking-wider text-white">LNDRY</span>
        </div>
        <div className="space-y-5 mb-24 max-w-xl">
          <h1 className="text-4xl lg:text-[44px] font-semibold tracking-tight leading-[1.12]">
            Operations visibility for every care handover.
          </h1>
          <p className="text-white/70 text-base lg:text-[17px] leading-relaxed mt-5">
            Review vendors, exceptions, payments, assignments, and immutable order events without losing the customer story.
          </p>
        </div>
        <div />
      </div>

      {/* Right side: Login form — exact match to mockup */}
      <div className="flex items-center justify-center p-8 bg-[#f7f7fb] w-full overflow-y-auto">
        <div className="w-full max-w-[430px] space-y-7">
          {/* Brand Logo */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="h-20 w-20 rounded-2xl bg-white p-2 shadow-sm border border-[#e8e8ef] overflow-hidden flex items-center justify-center">
              <img
                src="/lndry-assets/logos/brand-logo.jpg"
                className="h-full w-full object-contain"
                alt="LNDRY Logo"
              />
            </div>
            <span className="text-xl font-extrabold text-[#0f172a] mt-2.5 tracking-wider">LNDRY</span>
          </div>

          <div>
            <h2 className="text-[28px] font-bold tracking-tight text-[#0f172a]">Admin sign in</h2>
            <p className="text-[14px] text-[#64748b] mt-2 leading-relaxed">
              Use your authorised operations account. A second factor is required after password verification.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-[13px] font-bold text-[#0f172a]">Email address</label>
              <Input
                id="email"
                type="email"
                placeholder="operations@lndry.in"
                autoComplete="email"
                className="bg-white border-[#e8e8ef] text-[#0f172a] focus-visible:ring-[#6366F1] focus-visible:border-[#6366F1] h-[52px] rounded-2xl px-4 text-[14px]"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-[#EF4444]">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-[13px] font-bold text-[#0f172a]">Password</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="bg-white border-[#e8e8ef] text-[#0f172a] focus-visible:ring-[#6366F1] focus-visible:border-[#6366F1] h-[52px] rounded-2xl px-4 pr-10 text-[14px]"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f172a] transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[#EF4444]">{errors.password.message}</p>
              )}
            </div>

            {attempts >= 3 && (
              <div className="rounded-2xl bg-[#FFFBEB] p-3 text-xs text-[#B45309] border border-[#F59E0B]/20">
                ⚠️ Too many failed attempts. Please verify your credentials.
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white h-[52px] font-bold rounded-full text-[14px] mt-2 shadow-[0_4px_14px_rgba(6,182,212,0.25)] transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Continue to second factor"
              )}
            </Button>
          </form>

          <div className="rounded-2xl border border-[#e8e8ef] bg-white p-4 shadow-[0_1px_3px_rgba(42,36,95,0.04)]">
            <h3 className="text-[13px] font-bold text-[#0f172a]">Security requirement</h3>
            <p className="text-[12px] text-[#64748b] mt-1.5 leading-relaxed">
              TOTP authenticator preferred. Secure fallback is available only when enabled.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  )
}



