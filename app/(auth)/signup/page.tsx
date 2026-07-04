"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { postJson } from "@/lib/client/api"
import { signupSchema } from "@/lib/validation/auth"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validate with the same schema the server uses (single source of truth).
    const parsed = signupSchema.safeParse({ name, email })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setSubmitting(true)
    const res = await postJson("/api/auth/signup", parsed.data)
    setSubmitting(false)

    if (!res.ok) {
      setError(res.error ?? "Something went wrong. Please try again.")
      return
    }

    router.push(`/verify-otp?email=${encodeURIComponent(parsed.data.email)}`)
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="text-sm text-text-muted">
          One quick step, then your money plan. No bank linking, ever.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="Samay Raina"
          />
        </div>
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
          {submitting ? "Sending code…" : "Continue"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-mentor-blue">
          Log in
        </Link>
      </p>
    </div>
  )
}
