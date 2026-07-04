import type { NudgeType } from "@/lib/nudge"

// Milestone 6 — Habit & AI Learning Loop types (PRD 06). Pure, DB-agnostic: the
// profile is computed from stored Done/Skip/Remind-later history and turned into
// the adaptation signals the M5 engine and AI phrasing layer consume.

export type CoachingToneValue = "friendly" | "direct" | "strict" | "calm" | "motivational"

// The subset of an ActionRecord row the habit model reasons over.
export interface HabitActionInput {
  category: string
  actionKey: string
  response: "done" | "skipped" | "remind_later"
  createdAt: Date
}

export interface TypeStat {
  done: number
  skip: number
  remind: number
}

export type HabitSignal = "strong" | "building" | "weak" | "unknown"

// One of the seven §2 habit dimensions, reduced to a legible signal + one line.
export interface HabitDimension {
  key: string
  label: string
  signal: HabitSignal
  detail: string
}

export interface HabitProfile {
  totalResponses: number
  // Per-nudge-type Done/Skip/Remind tallies (Remind never counts as failure, §3).
  perType: Record<NudgeType, TypeStat>
  // Feeds the M5 scoring engine's readiness factor (§4). Absent types keep the
  // template heuristic.
  readinessHints: Partial<Record<NudgeType, number>>
  // Soft nudge types the user repeatedly skipped — suppressed so a different
  // nudge surfaces ("reduces future frequency if repeated", §3). Essentials
  // (debt/low_money) and the safe-spend floor are never suppressed.
  suppressedTypes: NudgeType[]
  // §5: user skips bigger saves but completes small ones → ask smaller.
  preferSmallerSaves: boolean
  // §5: completing a subscription cleanup invites a low-friction savings follow-up.
  subscriptionCleanupDone: boolean
  // §4 time-of-day signal (surfaced as insight; delivery-time shifting needs
  // push notifications, which are out of Phase 1 scope).
  timeOfDay: "morning" | "evening" | "mixed" | "unknown"
  // The seven §2 dimensions for the weekly insight (§7).
  dimensions: HabitDimension[]
}
