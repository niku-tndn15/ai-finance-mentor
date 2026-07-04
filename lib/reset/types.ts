import type { CoachGoalView, CoachRecommendation } from "@/lib/coach"
import type { FinancialModelInput, SafeToUseResult } from "@/lib/financial-model"
import type { HabitProfile } from "@/lib/habit"

// Milestone 8 — Monthly Reset types (PRD 08 §3). The reset is composed
// deterministically from manual inputs + real Done/Skip nudge history and the
// M3/M4 services, so it always works without AI (which only rephrases the
// summary) and stays consistent with safe-to-use money and goals (§7).

export interface MonthlyResetInput {
  // Habit profile over the reset window (the trailing ~30 days).
  profile: HabitProfile
  goals: CoachGoalView[]
  // The single recommended next action (M4 coach), if any.
  recommendation: CoachRecommendation | null
  // Manual inputs — used for the planned-savings check (§3 "did I save enough?").
  model: FinancialModelInput
  // Named movable costs (semi-negotiable expenses + subscriptions), biggest
  // first is fine — the generator sorts. Carries the names the model input
  // strips, so the reset can point at "eating out" specifically (§3 example).
  flexibleCosts: Array<{ name: string; amount: number }>
  // The M3 safe-to-use result — the source of "safe-to-use money for next month".
  safe: SafeToUseResult
}

export interface MonthlyResetContent {
  // Mentor-style headline check-in (§3).
  summary: string
  // Each answers one of the six §3 questions.
  overspend: string // "Did I overspend?"
  savings: string // "Did I save enough?"
  biggestLeak: string // "Which category or behavior hurt me most?"
  goalMovement: string // "Which goal moved forward?"
  changeNextMonth: string // "What should I change next month?"
  safeToUseNextMonth: number // "What is my safe-to-use money for next month?"
  safeToUseSummary: string
  // One recommended change + its ActionRecord linkage (reuse M4 storage).
  nextAction: string
  nextActionCategory: string
  nextActionKey: string
}
