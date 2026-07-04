"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { postJson } from "@/lib/client/api"
import { otpCodeSchema } from "@/lib/validation/auth"

const RESEND_COOLDOWN = 60

type Purpose = "signup_verification" | "password_reset"

function VerifyOtpInner() {
  const router = useRouter()
  const params = useSearchParams()
  const email = params.get("email") ?? ""
  const purpose: Purpose =
    params.get("purpose") === "password_reset" ? "password_reset" : "signup_verification"

  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN)

  // Tick the resend cooldown down to zero.
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)

    const parsed = otpCodeSchema.safeParse(code)
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setSubmitting(true)
    const res = await postJson("/api/auth/verify-otp", { email, code: parsed.data, purpose })
    setSubmitting(false)

    if (!res.ok) {
      setError(res.error ?? "That code isn't right. Please try again.")
      return
    }

    router.push(purpose === "password_reset" ? "/reset-password" : "/set-password")
  }

  async function handleResend() {
    if (cooldown > 0) return
    setError(null)
    setNotice(null)
    const res = await postJson<{ retryAfterSeconds?: number }>("/api/auth/resend-otp", {
      email,
      purpose,
    })
    // Server responds generically; always reset the cooldown and reassure.
    setCooldown(res.data.retryAfterSeconds ?? RESEND_COOLDOWN)
    setNotice("If that email is registered, a new code is on its way.")
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold">Enter your code</h1>
        <p className="text-sm text-text-muted">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-text-primary">{email || "your email"}</span>. It
          expires in 10 minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="code">6-digit code</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            className="text-center text-lg tracking-[0.5em]"
          />
        </div>

        {error && <p className="text-sm text-zone-red">{error}</p>}
        {notice && <p className="text-sm text-zone-green">{notice}</p>}

        <Button type="submit" size="lg" className="mt-2 w-full" disabled={submitting}>
          {submitting ? "Verifying…" : "Verify"}
        </Button>
      </form>

      <button
        type="button"
        onClick={handleResend}
        disabled={cooldown > 0}
        className="mt-6 text-center text-sm text-text-muted disabled:opacity-60"
      >
        {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
      </button>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpInner />
    </Suspense>
  )
}
