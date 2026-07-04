"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { postJson } from "@/lib/client/api"

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await postJson("/api/auth/logout", {})
    // Full navigation so any cached server-component state is dropped.
    router.replace("/login")
    router.refresh()
  }

  return (
    <Button variant="outline" className="w-full" onClick={handleLogout} disabled={loading}>
      <LogOut className="size-4" />
      {loading ? "Logging out…" : "Log out"}
    </Button>
  )
}
