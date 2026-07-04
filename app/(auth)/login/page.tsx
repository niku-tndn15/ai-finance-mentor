"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordField } from "@/components/auth/password-field"
import { postJson } from "@/lib/client/api"
import { loginSchema } from "@/lib/validation/auth"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setSubmitting(true)
    const res = await postJson<{ redirect?: string }>("/api/auth/login", parsed.data)
    setSubmitting(false)

    if (!res.ok) {
      setError(res.error ?? "Incorrect email or password.")
      return
    }

    // The server decides where to land: saved data if the plan exists, otherwise
    // the questionnaire to finish setup.
    router.push(res.data.redirect ?? "/home")
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-text-muted">Log in to see what&apos;s safe to spend today.</p>
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

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        <div className="-mt-1 text-right">
          <Link href="/forgot-password" className="text-sm text-mentor-blue">
            Forgot password?
          </Link>
        </div>

        {error && <p className="text-sm text-zone-red">{error}</p>}

        <Button type="submit" size="lg" className="mt-2 w-full" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        New to UrPaisa?{" "}
        <Link href="/signup" className="font-medium text-mentor-blue">
          Create an account
        </Link>
      </p>
    </div>
  )
}
