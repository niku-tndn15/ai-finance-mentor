"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { PasswordField } from "@/components/auth/password-field"
import { postJson } from "@/lib/client/api"
import { passwordSchema } from "@/lib/validation/auth"

export default function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = passwordSchema.safeParse(password)
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setSubmitting(true)
    const res = await postJson<{ redirect?: string; code?: string }>("/api/auth/set-password", {
      password: parsed.data,
    })
    setSubmitting(false)

    if (!res.ok) {
      // Pending window expired → send them back to re-verify.
      if (res.data?.code === "pending_expired") {
        router.push("/signup")
        return
      }
      setError(res.error ?? "Something went wrong. Please try again.")
      return
    }

    // New account → straight into the questionnaire.
    router.push(res.data.redirect ?? "/onboarding")
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold">Set your password</h1>
        <p className="text-sm text-text-muted">
          This keeps your money plan private and lets you log back in.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          showChecklist
        />

        {error && <p className="text-sm text-zone-red">{error}</p>}

        <Button type="submit" size="lg" className="mt-2 w-full" disabled={submitting}>
          {submitting ? "Saving…" : "Save and continue"}
        </Button>
      </form>
    </div>
  )
}
