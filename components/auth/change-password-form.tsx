"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { PasswordField } from "@/components/auth/password-field"
import { postJson } from "@/lib/client/api"
import { changePasswordSchema } from "@/lib/validation/auth"

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setSubmitting(true)
    const res = await postJson("/api/auth/change-password", parsed.data)
    setSubmitting(false)

    if (!res.ok) {
      setError(res.error ?? "Something went wrong. Please try again.")
      return
    }

    setSuccess(true)
    setCurrentPassword("")
    setNewPassword("")
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <PasswordField
        id="current-password"
        label="Current password"
        value={currentPassword}
        onChange={setCurrentPassword}
        autoComplete="current-password"
      />
      <PasswordField
        id="new-password"
        label="New password"
        value={newPassword}
        onChange={setNewPassword}
        showChecklist
      />

      {error && <p className="text-sm text-zone-red">{error}</p>}
      {success && (
        <p className="text-sm text-zone-green">
          Password updated. Other devices have been logged out.
        </p>
      )}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Updating…" : "Update password"}
      </Button>
    </form>
  )
}
