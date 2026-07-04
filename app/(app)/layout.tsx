import { redirect } from "next/navigation"

import { BottomNav } from "@/components/bottom-nav"
import { AnalyticsIdentify } from "@/components/analytics/analytics-identify"
import { getCurrentUser } from "@/lib/auth/session"

// Authoritative auth check for the app surface. Middleware already blocks
// requests with no session cookie; here we do the real DB-backed validation
// (session exists and hasn't expired) and redirect stale sessions to /login.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col">
      <AnalyticsIdentify userId={user.id} />
      <div className="flex-1 px-4 py-6 pb-24">{children}</div>
      <BottomNav />
    </div>
  )
}
