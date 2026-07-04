"use client"

import { useState } from "react"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { capture, EVENTS } from "@/lib/analytics/events"

// Milestone 10 — the one interactive control on the weekly challenge card, so
// "challenge participation rate" (PRD 00 §9) is a real signal rather than a view.
// Client-only: it records the opt-in to analytics and confirms; the challenge
// itself is tracked through the shared Done/Skip action history like any nudge.
export function ChallengeParticipation() {
  const [joined, setJoined] = useState(false)

  if (joined) {
    return (
      <p className="flex items-center gap-1 text-sm font-medium text-zone-green">
        <Check className="size-4" aria-hidden /> You&apos;re in — good luck this week!
      </p>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="self-start"
      onClick={() => {
        capture(EVENTS.challengeParticipated)
        setJoined(true)
      }}
    >
      I&apos;m in
    </Button>
  )
}
