"use client"

import { useEffect } from "react"
import posthog from "posthog-js"

// Milestone 0 skeleton: no-ops until NEXT_PUBLIC_POSTHOG_KEY is set (Netlify UI in prod,
// .env.local locally). Real events (onboarding, nudges, etc.) are wired in Milestone 10.
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key || posthog.__loaded) return

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false,
      person_profiles: "identified_only",
    })
  }, [])

  return <>{children}</>
}
