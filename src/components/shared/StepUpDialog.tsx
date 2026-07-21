"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ShieldCheck, X } from "lucide-react"
import { toast } from "sonner"

import { useAuthStore } from "@/store/auth.store"
import { getStepUpToken } from "@/services/auth.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

const stepUpSchema = z.object({
  totpCode: z.string().length(6, "Verification code must be exactly 6 digits"),
})

type StepUpForm = z.infer<typeof stepUpSchema>

export function StepUpDialog() {
  const { stepUpChallenge, stepUpCancel, setStepUpChallenge } = useAuthStore()
  const [errorText, setErrorText] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StepUpForm>({
    resolver: zodResolver(stepUpSchema),
  })

  const isOpen = !!stepUpChallenge

  function handleClose() {
    if (stepUpCancel) {
      stepUpCancel()
    }
    setStepUpChallenge(null, null)
    setErrorText(null)
    reset()
  }

  async function onSubmit(values: StepUpForm) {
    setErrorText(null)
    try {
      const token = await getStepUpToken(values.totpCode)
      if (stepUpChallenge) {
        stepUpChallenge(token)
      }
      setStepUpChallenge(null, null)
      toast.success("Identity verified successfully.")
      reset()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Verification failed. Check your TOTP code."
      setErrorText(message)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-[400px] border-0 shadow-lg bg-card">
        <DialogHeader className="text-center pb-2 relative">
          <button
            onClick={handleClose}
            className="absolute right-0 top-0 text-muted-foreground hover:text-foreground rounded-full p-1 hover:bg-muted"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="mx-auto w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-3 text-brand-500">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <DialogTitle className="text-xl font-bold font-display text-foreground">
            Step-Up Verification
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            This is a high-risk operation. Please enter the 6-digit verification code from your authenticator app to authorize this action.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="totpCode" className="text-sm font-medium">
              Authenticator Code
            </Label>
            <Input
              id="totpCode"
              type="text"
              placeholder="000000"
              maxLength={6}
              autoFocus
              className="bg-background text-foreground text-center tracking-widest text-lg font-mono"
              {...register("totpCode")}
            />
            {errors.totpCode && (
              <p className="text-xs text-danger text-center">{errors.totpCode.message}</p>
            )}
          </div>

          {errorText && (
            <div className="rounded-lg bg-danger/10 border border-danger/20 p-3 text-xs text-danger text-center">
              {errorText}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-brand-500 hover:bg-brand-600 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
