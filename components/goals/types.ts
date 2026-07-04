import type {
  DebtTypeValue,
  DebtUrgency,
  GoalCategoryValue,
  GoalFlexibilityValue,
  RiskLevelValue,
} from "@/lib/coach"

// Serializable shapes passed from the /goals server component into the client
// section/card/form components. Dates are pre-formatted to YYYY-MM-DD strings so
// the date inputs bind directly and nothing non-serializable crosses the
// server→client boundary.

export interface GoalDTO {
  id: string
  name: string
  category: GoalCategoryValue | null
  targetAmount: number
  currentSavings: number
  deadline: string | null // YYYY-MM-DD
  priority: number | null
  flexibility: GoalFlexibilityValue
  monthlyContribution: number | null
  // Computed by the goal coach:
  progressPercent: number
  remaining: number
  requiredMonthlyContribution: number | null
  note: string
}

export interface DebtDTO {
  id: string
  type: DebtTypeValue
  outstanding: number
  interestRate: number | null
  minimumPayment: number | null
  dueDate: string | null // YYYY-MM-DD
  lateFeeRisk: RiskLevelValue | null
  stressLevel: RiskLevelValue | null
  // Computed by the debt coach:
  urgency: DebtUrgency
  reasons: string[]
  daysUntilDue: number | null
}
