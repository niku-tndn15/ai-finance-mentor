"use client"

import { useEffect } from "react"

import { capture, type AnalyticsEvent } from "@/lib/analytics/events"

// Milestone 10 — fires a single analytics event when a server-rendered screen
// mounts (e.g. "safe_to_use_viewed", "reflection_opened"). Drop it into a page to
// measure view/open rates (PRD 00 §9) without turning the page into a client
// component.
export function TrackView({ event }: { event: AnalyticsEvent }) {
  useEffect(() => {
    capture(event)
  }, [event])

  return null
}
