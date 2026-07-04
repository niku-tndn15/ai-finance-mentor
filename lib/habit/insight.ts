import type { HabitDimension, HabitProfile } from "./types"

// Milestone 6 — the lightweight weekly habit insight (PRD 06 §7). Deliberately
// NOT the formal 0–100 Money Health Score (explicitly Phase 2+). Pure.

export interface WeeklyInsight {
  hasData: boolean
  headline: string
  strongest?: string
  weakest?: string
  focus: string
  timeNote?: string
}

const SIGNAL_RANK: Record<HabitDimension["signal"], number> = {
  strong: 3,
  building: 2,
  weak: 1,
  unknown: 0,
}

export function buildWeeklyInsight(profile: HabitProfile): WeeklyInsight {
  const done = Object.values(profile.perType).reduce((n, s) => n + s.done, 0)
  const skip = Object.values(profile.perType).reduce((n, s) => n + s.skip, 0)

  if (done + skip < 2) {
    return {
      hasData: false,
      headline: "UrPaisa is still learning your money habits.",
      focus: "Respond to a few more daily actions and I'll start spotting your patterns here.",
    }
  }

  const known = profile.dimensions.filter((d) => d.signal !== "unknown")
  // Only celebrate a habit that's actually landing (strong/building), and only
  // flag a weak one — never call a habit the user keeps skipping their "strongest".
  const strongestDim = [...known]
    .sort((a, b) => SIGNAL_RANK[b.signal] - SIGNAL_RANK[a.signal])
    .find((d) => d.signal === "strong" || d.signal === "building")
  const weakestDim = [...known]
    .sort((a, b) => SIGNAL_RANK[a.signal] - SIGNAL_RANK[b.signal])
    .find((d) => d.signal === "weak" && d.key !== strongestDim?.key)

  const headline = `You've completed ${done} of ${done + skip} money actions recently.`

  return {
    hasData: true,
    headline,
    strongest: strongestDim ? `Your strongest habit: ${strongestDim.label.toLowerCase()}.` : undefined,
    weakest: weakestDim ? `Where you can grow: ${weakestDim.label.toLowerCase()}.` : undefined,
    focus: buildFocus(profile),
    timeNote:
      profile.timeOfDay === "evening"
        ? "You tend to act in the evenings — a good time for your daily check-in."
        : undefined,
  }
}

// One concrete "here's how I'm adapting" line, mirroring the §5 examples.
function buildFocus(profile: HabitProfile): string {
  if (profile.preferSmallerSaves) {
    return "I'll suggest smaller saving amounts for now so they're easier to complete."
  }
  if (profile.suppressedTypes.length > 0) {
    return "I'll ease off the nudges you keep skipping and focus on what's working."
  }
  if (profile.subscriptionCleanupDone) {
    return "Nice subscription cleanup — a small automatic saving is a great next step."
  }
  if (profile.perType.debt.done >= 1 && profile.perType.goal.skip > profile.perType.goal.done) {
    return "I'll keep prioritising your debt while it needs attention."
  }
  return "Keep it up — I'll keep tuning your daily action to how you respond."
}
