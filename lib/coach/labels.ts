import type { DebtTypeValue, DebtUrgency, GoalCategoryValue } from "./types"

// UI-facing display strings for the coach enums. Kept here (not in components) so
// the API, forms, and cards all read from one place.

export const DEBT_TYPE_LABEL: Record<DebtTypeValue, string> = {
  credit_card: "Credit card",
  personal_loan: "Personal loan",
  education_loan: "Education loan",
  vehicle_loan: "Vehicle loan",
  bnpl: "Buy now, pay later",
  informal: "Personal borrowing",
  other: "Other debt",
}

export const GOAL_CATEGORY_LABEL: Record<GoalCategoryValue, string> = {
  emergency_fund: "Emergency fund",
  essential_obligation: "Essential obligation",
  time_bound: "Time-bound goal",
  lifestyle: "Lifestyle goal",
  investing: "Investing readiness",
}

export const DEBT_URGENCY_LABEL: Record<DebtUrgency, string> = {
  highest: "Highest urgency",
  medium: "Medium urgency",
  lower: "Lower urgency",
}
