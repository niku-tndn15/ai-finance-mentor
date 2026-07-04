import type { CoachDebtView, CoachGoalView } from "@/lib/coach"
import type { SafeToUseResult } from "@/lib/financial-model"

// Milestone 5 — Nudge & Recommendation Engine types (PRD 05). Pure, DB-agnostic
// so the engine is unit-testable with plain objects and an injectable `now`.

export type NudgeType =
  | "payday"
  | "weekend"
  | "subscription"
  | "goal"
  | "debt"
  | "impulse"
  | "low_money"
  | "safe_spend"

// Everything the engine reasons over. Goals/debts arrive already ordered by the
// M4 coach; safe-to-use is the M3 engine's output. `readinessHint` is where M6
// will inject learned behaviour — in M5 it's absent and readiness stays a
// per-template heuristic (PRD 05 §2 note).
export interface NudgeContext {
  payday: number // day of month (1–31)
  subscriptionsCount: number
  goals: CoachGoalView[]
  debts: CoachDebtView[]
  safe: SafeToUseResult
  now: Date
  // --- Milestone 6 habit-learning inputs (all optional; absent = M5 defaults) ---
  // Learned readiness per type, feeding the scoring factor (PRD 06 §4).
  readinessHint?: Partial<Record<NudgeType, number>>
  // Soft types the user repeatedly skipped — not generated today so a different
  // nudge surfaces (PRD 06 §3 "reduces future frequency if repeated").
  suppressedTypes?: NudgeType[]
  // Ask for smaller saves after the user skips bigger ones (PRD 06 §5).
  preferSmallerSaves?: boolean
}

// A single candidate nudge carrying the full §5 anatomy plus the three §2 factors.
export interface NudgeCandidate {
  type: NudgeType
  // §4 trigger priority, 1 (most urgent) … 9 (general weekly fallback).
  urgencyRank: number
  trigger: string
  action: string
  reason: string
  expectedBenefit: string
  // Links a Done/Skip/Remind-later response back to the shared M4 ActionRecord.
  actionKey: string
  category: string
  goalId?: string
  debtId?: string
  // §2 factors, 0–1. Readiness = how likely the user completes it; impact = how
  // much it improves their situation.
  readiness: number
  impact: number
}

export interface ScoredNudge extends NudgeCandidate {
  score: number
}
