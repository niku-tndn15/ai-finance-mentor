import type { CoachGoalView, CoachRecommendation } from "@/lib/coach"
import type { FinancialModelInput } from "@/lib/financial-model"
import type { HabitProfile, WeeklyInsight } from "@/lib/habit"

// Milestone 8 — Weekly Reflection types (PRD 08 §2). The reflection is composed
// deterministically from real Done/Skip/Remind-later history and the M4–M6
// services, so it always works without AI (which only rephrases the summary).

export interface ReflectionInput {
  // Habit profile computed over the reflection window (last 7 days).
  profile: HabitProfile
  goals: CoachGoalView[]
  // The single recommended next action (M4 coach), if any.
  recommendation: CoachRecommendation | null
  // M6 weekly insight over the same window.
  insight: WeeklyInsight
  // For challenge selection (subscription count, etc.).
  model: FinancialModelInput
}

export interface ReflectionContent {
  completed: number
  total: number
  // Mentor-style narrative: completions + what went well + what slipped (§2).
  summary: string
  // One detected pattern (§2).
  pattern: string
  // One recommended next action + its ActionRecord linkage (§2, reuse M4 storage).
  nextAction: string
  nextActionCategory: string
  nextActionKey: string
  goalProgress: string
  habitInsight: string
  // Optional MVP-plus habit challenge (§4/§5).
  challengeTitle: string | null
  challengeDetail: string | null
}
