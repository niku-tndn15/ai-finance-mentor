import posthog from "posthog-js"

// Milestone 10 — the single analytics surface (PRD 00 §9 Success Metrics). One
// place defines every event name and wraps posthog-js so call sites stay tidy
// and nothing fires when analytics isn't configured (no key locally / in tests).
// Client-only: these run from "use client" components and browser handlers.

// The MVP event set. Retention (W1/W4/M3) and WAU are derived in PostHog from
// identified pageviews, so they need no bespoke event — just identify + pageview.
export const EVENTS = {
  onboardingCompleted: "onboarding_completed", // activation
  goalSet: "goal_set", // activation
  safeToUseViewed: "safe_to_use_viewed", // activation
  nudgeCompleted: "nudge_completed", // activation (first) + engagement
  questionAsked: "question_asked", // engagement
  reflectionOpened: "reflection_opened", // engagement
  challengeParticipated: "challenge_participated", // engagement
} as const

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS]

function ready(): boolean {
  return typeof window !== "undefined" && posthog.__loaded === true
}

export function capture(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (!ready()) return
  posthog.capture(event, props)
}

// Tie events to a stable user so WAU + W1/W4/M3 retention can be computed. Called
// once per app-surface load with the server-known user id.
export function identify(userId: string): void {
  if (!ready()) return
  posthog.identify(userId)
}

export function capturePageview(): void {
  if (!ready()) return
  posthog.capture("$pageview")
}
