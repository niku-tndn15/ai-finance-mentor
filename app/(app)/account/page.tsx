import { redirect } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChangePasswordForm } from "@/components/auth/change-password-form"
import { LogoutButton } from "@/components/auth/logout-button"
import { getCurrentUser } from "@/lib/auth/session"

// Minimal account settings (IMPLEMENTATION_PLAN.md M1 — beta readiness item):
// change password + "logged in since". Deliberately not a full profile UI.
export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const loggedInSince = user.sessionCreatedAt.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-sm text-text-muted">{user.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted">
            Logged in since <span className="text-text-primary">{loggedInSince}</span>
          </p>
          <LogoutButton />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
