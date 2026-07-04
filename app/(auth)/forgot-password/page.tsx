"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { postJson } from "@/lib/client/api"
import { emailSchema } from "@/lib/validation/auth"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = emailSchema.safeParse(email)
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setSubmitting(true)
    // Response is intentionally generic; we always move to the code screen so
    // the UI can't be used to discover which emails have accounts.
    await postJson("/api/auth/forgot-password", { email: parsed.data })
    setSubmitting(false)

    router.push(
      `/verify-otp?email=${encodeURIComponent(parsed.data)}&purpose=password_reset`
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold">Reset your password</h1>
        <p className="text-sm text-text-muted">
          Enter your email and we&apos;ll send a code to reset it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
          />
        </div>

        {error && <p className="text-sm text-zone-red">{error}</p>}

        <Button type="submit" size="lg" className="mt-2 w-full" disabled={submitting}>
          {submitting ? "Sending code…" : "Send reset code"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-mentor-blue">
          Back to login
        </Link>
      </p>
    </div>
  )
}
