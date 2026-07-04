// Milestone 4 — Goal & Debt Coach (PRD 04). Pure, DB-agnostic input/output
// shapes so every rule in goal-coach / debt-coach / recommendation is unit-
// testable with plain objects and an injectable `now`. All money is whole INR
// rupees. Enum-like fields mirror the Prisma enums as string unions (same values)
// so this module never imports @prisma/client — the API maps rows into these.

export type GoalCategoryValue =
  | "emergency_fund"
  | "essential_obligation"
  | "time_bound"
  | "lifestyle"
  | "investing"

export type GoalFlexibilityValue = "fixed" | "flexible"

export type DebtTypeValue =
  | "credit_card"
  | "personal_loan"
  | "education_loan"
  | "vehicle_loan"
  | "bnpl"
  | "informal"
  | "other"

export type RiskLevelValue = "low" | "medium" | "high"

// Highest / medium / lower urgency buckets (PRD 04 §5).
export type DebtUrgency = "highest" | "medium" | "lower"

// --- Goal coach (PRD 04 §2 / §3) ---

// The narrow projection of a Goal row the coach reasons over. `id` is carried
// through so ordered/annotated outputs still point back to the DB row.
export interface CoachGoal {
  id: string
  name: string
  category?: GoalCategoryValue | null
  targetAmount: number
  currentSavings: number
  deadline?: Date | null
  priority?: number | null
  flexibility?: GoalFlexibilityValue | null
  monthlyContribution?: number | null
}

export interface CoachGoalView extends CoachGoal {
  // (current / target) clamped to 0–100, rounded.
  progressPercent: number
  // Rupees still to save.
  remaining: number
  // What must be set aside each month to hit the deadline (PRD 04 §2). Null when
  // there's no deadline to spread the remaining amount over.
  requiredMonthlyContribution: number | null
  // Whole months until the deadline (>=0), or null when there's no deadline.
  monthsToDeadline: number | null
  // Rank used for default ordering (lower = more important), before user override.
  defaultRank: number
  // One plain-language progress line (PRD 04 §2 example tone).
  note: string
}

// --- Debt coach (PRD 04 §4 / §5) ---

export interface CoachDebt {
  id: string
  type: DebtTypeValue
  outstanding: number
  interestRate?: number | null
  minimumPayment?: number | null
  dueDate?: Date | null
  lateFeeRisk?: RiskLevelValue | null
  stressLevel?: RiskLevelValue | null
}

export interface CoachDebtView extends CoachDebt {
  urgency: DebtUrgency
  // Human-readable drivers of the urgency, e.g. "due in 3 days", "high interest".
  reasons: string[]
  // Whole days until the due date (negative = overdue), or null when none set.
  daysUntilDue: number | null
}

// --- Save-vs-debt recommendation (PRD 04 §6 / §8) ---

export type RecommendationKind =
  | "debt_due_soon"
  | "balance_buffer_and_debt"
  | "extra_debt_payment"
  | "fund_goal"
  | "protect_essentials"

export interface CoachRecommendation {
  kind: RecommendationKind
  // Category + stable actionKey stored on the ActionRecord when the user responds.
  category: "debt" | "goal" | "save_vs_debt"
  actionKey: string
  title: string
  action: string // the one thing to do (PRD 04 §8: "one recommended action")
  reason: string // why — the tradeoff (PRD 04 §6)
  goalId?: string
  debtId?: string
}
