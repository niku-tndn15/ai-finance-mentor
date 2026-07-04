import type { CoachDebtView, CoachGoalView, CoachRecommendation } from "@/lib/coach"
import type { FinancialModelInput, SafeToUseResult } from "@/lib/financial-model"
import type { WeeklyInsight } from "@/lib/habit"

// Milestone 7 — Conversational Mentor types (PRD 07). The mentor is a
// deterministic core (grounded in the user's real model) that the AI layer only
// rephrases, so answers are always real and safe even when AI is unavailable
// (§7 / §8, PRD 09 §7).

export type MentorIntent =
  | "affordability"
  | "save_this_week"
  | "fix_first"
  | "why_not_saving"
  | "save_vs_debt"
  | "reduce_spending"
  | "unknown"

// PRD 07 §4 purchase-decision verdicts.
export type AffordVerdict = "safe_to_buy" | "buy_in_parts" | "buy_later" | "avoid_for_now"

// Everything a base-answer builder reasons over — all real, user-derived data.
export interface MentorContext {
  safe: SafeToUseResult
  model: FinancialModelInput
  goals: CoachGoalView[]
  debts: CoachDebtView[]
  recommendation: CoachRecommendation | null
  insight: WeeklyInsight
}

// The deterministic base answer (§6: real data, tradeoff, one next action).
export interface BaseAnswer {
  answer: string
  nextAction: string
  verdict?: AffordVerdict
  // Stated when a needed input is missing (§6 "state assumptions", §7).
  assumptions?: string
}

export interface MentorAnswer extends BaseAnswer {
  intent: MentorIntent
  // Whether the AI phrased it (false = deterministic fallback was used).
  usedAI: boolean
  // Drives the "this is an estimate" disclaimer (PRD 09 §5 / §7).
  lowConfidence: boolean
}
