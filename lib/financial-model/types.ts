// Milestone 2 — Financial Situation Model output types (PRD 02 §7).
//
// This service intentionally stops at the four "load / predictability / urgency"
// outputs the milestone owns. The remaining §7 outputs — safe-to-use money and
// current financial risk (Milestone 3) and the best-next-action candidate
// (Milestones 4–5) — build ON these, so they live in their own services later.
// Keeping this file free of @prisma/client imports lets it be unit-tested with
// plain objects.

export type IncomeStabilityLevel = "high" | "medium" | "low"
export type IncomeTypeValue = "fixed_salary" | "variable_income" | "mixed_income"
export type NegotiabilityValue = "non_negotiable" | "semi_negotiable"
export type RiskLevelValue = "low" | "medium" | "high"

// A five-point commitment band. `none` is distinct from `low` so copy can say
// "you have no fixed costs recorded" vs "your fixed costs are light".
export type CommitmentLoad = "none" | "low" | "moderate" | "high" | "very_high"

export type Predictability = "high" | "medium" | "low"
export type Urgency = "high" | "medium" | "low"
export type OverallDebtUrgency = "none" | "low" | "medium" | "high"

// The plain, DB-agnostic shape the model computes over. The API maps Prisma rows
// into this before calling `computeFinancialModel`.
export interface FinancialModelInput {
  income: {
    monthlyAmount: number
    payday: number // day of month (1–31); used by the safe-to-use engine
    stability: IncomeStabilityLevel
    plannedSavings: number
    irregularIncome?: number | null
    bonusIncome?: number | null
  }
  fixedExpenses: Array<{ amount: number; negotiability: NegotiabilityValue }>
  subscriptions: Array<{ amount: number }>
  goals: Array<{
    targetAmount: number
    currentSavings: number
    deadline?: Date | null
    monthlyContribution?: number | null
  }>
  debts: Array<{
    outstanding: number
    interestRate?: number | null
    minimumPayment?: number | null
    dueDate?: Date | null
    lateFeeRisk?: RiskLevelValue | null
    stressLevel?: RiskLevelValue | null
  }>
}

export interface DebtUrgencyBreakdown {
  index: number
  urgency: Urgency
  // Human-readable drivers, e.g. "high interest (36%)", "due in 4 days".
  reasons: string[]
}

export interface FinancialModelOutput {
  incomePredictability: Predictability

  fixedCommitmentLoad: {
    // Fixed expenses + subscriptions as a share of monthly income (0–1+).
    ratio: number
    monthlyAmount: number
    band: CommitmentLoad
  }

  goalCommitmentLoad: {
    // Total monthly contribution needed across goals, as a share of income.
    ratio: number
    monthlyAmount: number
    band: CommitmentLoad
  }

  debtUrgency: {
    overall: OverallDebtUrgency
    totalOutstanding: number
    totalMinimumPayments: number
    perDebt: DebtUrgencyBreakdown[]
  }
}
