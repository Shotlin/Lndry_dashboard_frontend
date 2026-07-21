"use client"

import { Suspense, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { verify2FA } from "@/services/auth.service"
import { useAuthStore } from "@/store/auth.store"

function Verify2faFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#6366F1] border-t-transparent" />
        <p className="text-sm text-[#64748b]">Initializing 2FA...</p>
      </div>
    </div>
  )
}

function resolveRedirectTarget(raw: string | null): string {
  if (!raw) return "/dashboard"
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard"
  return raw
}

function Verify2faPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, clearAuth } = useAuthStore()
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const setRef = useCallback((index: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[index] = el
  }, [])

  function handleDigitChange(index: number, value: string) {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/^\d$/.test(value)) return

    const newDigits = [...digits]
    newDigits[index] = value
    setDigits(newDigits)

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5 && newDigits.every(d => d !== "")) {
      handleSubmit(newDigits.join(""))
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length > 0) {
      const newDigits = [...digits]
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || ""
      }
      setDigits(newDigits)
      const nextEmpty = newDigits.findIndex(d => d === "")
      if (nextEmpty >= 0) {
        inputRefs.current[nextEmpty]?.focus()
      } else {
        inputRefs.current[5]?.focus()
        handleSubmit(newDigits.join(""))
      }
    }
  }

  async function handleSubmit(code?: string) {
    const fullCode = code || digits.join("")
    if (fullCode.length < 6) return

    setIsSubmitting(true)
    setErrorText(null)
    try {
      const data = await verify2FA(fullCode)
      const redirect = resolveRedirectTarget(searchParams.get("redirect"))
      login(data.user, data.accessToken, false)
      toast.success("2FA code verified successfully!")
      router.push(redirect)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Invalid verification code. Please try again."
      setErrorText(message)
      toast.error("2FA Verification failed")
      setDigits(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCancel() {
    clearAuth()
    router.replace("/login")
  }

  return (
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2 h-screen overflow-hidden">
      {/* Left side: Aqua panel — matching admin-2fa-v1.png */}
      <div className="bg-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#4F46E5] text-white p-16 flex-col justify-between hidden md:flex">
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="opacity-90">
            <path d="M4 24V8C4 5.79 5.79 4 8 4H12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <text x="14" y="23" fill="white" fontSize="16" fontWeight="600" fontFamily="Inter, sans-serif">ndry</text>
          </svg>
        </div>
        <div className="space-y-5 mb-24 max-w-xl">
          <h1 className="text-4xl lg:text-[44px] font-semibold tracking-tight leading-[1.12]">
            One more security check.
          </h1>
          <p className="text-white/70 text-base lg:text-[17px] leading-relaxed mt-5">
            Critical vendor, order, payment, and audit actions remain protected by role-scoped access and second-factor verification.
          </p>
        </div>
        <div />
      </div>

      {/* Right side: 2FA form — matching admin-2fa-v1.png */}
      <div className="flex items-center justify-center p-8 bg-[#f7f7fb] w-full overflow-y-auto">
        <div className="w-full max-w-[430px] space-y-7">
          {/* Password verified badge */}
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#047857]">
            Password verified
          </span>

          <div>
            <h2 className="text-[28px] font-bold tracking-tight text-[#0f172a]">
              Enter authenticator code
            </h2>
            <p className="text-[14px] text-[#64748b] mt-2 leading-relaxed">
              Use the six-digit code from the authenticator linked to operations@lndry.in.
            </p>
          </div>

          {/* 6-digit input boxes — exact match to mockup */}
          <div className="flex gap-3" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={setRef(i)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoFocus={i === 0}
                className="w-[52px] h-[52px] text-center text-[20px] font-semibold text-[#0f172a] bg-white border border-[#e8e8ef] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] transition-all"
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          {errorText && (
            <div className="rounded-2xl bg-[#FEF2F2] border border-[#EF4444]/20 p-3 text-xs text-[#B91C1C] text-center">
              {errorText}
            </div>
          )}

          <div className="space-y-4 pt-1">
            <Button
              type="button"
              onClick={() => handleSubmit()}
              className="w-full bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white h-[52px] font-bold rounded-full text-[14px] shadow-[0_4px_14px_rgba(6,182,212,0.25)] transition-all"
              disabled={isSubmitting || digits.some(d => d === "")}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify and open dashboard"
              )}
            </Button>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleCancel}
                className="text-[13px] text-[#64748b] hover:text-[#6366F1] font-medium transition-colors"
              >
                Use recovery method
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Verify2faPage() {
  return (
    <Suspense fallback={<Verify2faFallback />}>
      <Verify2faPageContent />
    </Suspense>
  )
}
