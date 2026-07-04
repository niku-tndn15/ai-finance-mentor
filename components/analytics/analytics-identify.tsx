"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

import { capturePageview, identify } from "@/lib/analytics/events"

// Milestone 10 — identifies the signed-in user to PostHog and captures a
// pageview on every route change within the app surface (PRD 00 §9). Rendered
// once from the (app) layout with the server-known user id. Identify + pageviews
// are what WAU and W1/W4/M3 retention are derived from in PostHog.
export function AnalyticsIdentify({ userId }: { userId: string }) {
  const pathname = usePathname()

  useEffect(() => {
    identify(userId)
  }, [userId])

  useEffect(() => {
    capturePageview()
  }, [pathname])

  return null
}
