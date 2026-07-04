import type {
  CommitmentLoad,
  DebtUrgencyBreakdown,
  FinancialModelInput,
  FinancialModelOutput,
  OverallDebtUrgency,
  Urgency,
} from "./types"

// Milestone 2 — Financial Situation Model service (PRD 02 §7).
//
// Pure functions over a plain input shape (see types.ts). No DB, no dates-from-
// now beyond an injectable `now`, so every branch is unit-testable. All money is
// whole INR rupees.

// Commitment-load band thresholds, expressed as a share of monthly income.
// Chosen to be legible rather than clever: under a third is light, a third to a
// half is moderate, half to ~70% is high, above that is very high.
const LOAD_BANDS: Array<{ max: number; band: CommitmentLoad }> = [
  { max: 0.3, band: "low" },
  { max: 0.5, band: "moderate" },
  { max: 0.7, band: "high" },
  { max: Infinity, band: "very_high" },
]

function classifyLoad(ratio: number): CommitmentLoad {
  if (ratio <= 0) return "none"
  return LOAD_BANDS.find((b) => ratio < b.max)?.band ?? "very_high"
}

function sum(values: number[]): number {
  return values.reduce((total, n) => total + n, 0)
}

// Whole days from `now` to `date` (negative = already past).
function daysUntil(date: Date, now: Date): number {
  const ms = date.getTime() - now.getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

// Income predictability (PRD 02 §2 → §7). Driven by the user's stability level,
// which itself is derived from income type at setup. A meaningful irregular-
// income share nudges an otherwise-"high" reading down, because lumpy money is
// harder to plan around even on a salary.
function computeIncomePredictability(
  income: FinancialModelInput["income"]
): FinancialModelOutput["incomePredictability"] {
  const base = income.stability
  const irregular = income.irregularIncome ?? 0
  const irregularShare = income.monthlyAmount > 0 ? irregular / income.monthlyAmount : 0

  if (base === "high" && irregularShare > 0.3) return "medium"
  return base
}

// Per-debt urgency (PRD 02 §5 → §7). A first-pass classifier the Goal & Debt
// Coach (Milestone 4 §5) will formalise; here it exists because §7 lists debt
// urgency as a model output. Any single "high" driver makes the debt high
// urgency (worst-driver-wins), since urgency is about the most pressing risk.
function classifyDebt(
  debt: FinancialModelInput["debts"][number],
  now: Date
): { urgency: Urgency; reasons: string[] } {
  const reasons: string[] = []
  let urgency: Urgency = "low"

  const bump = (level: Urgency) => {
    if (level === "high") urgency = "high"
    else if (level === "medium" && urgency !== "high") urgency = "medium"
  }

  const rate = debt.interestRate ?? null
  if (rate !== null) {
    if (rate >= 24) {
      bump("high")
      reasons.push(`high interest (${rate}%)`)
    } else if (rate >= 12) {
      bump("medium")
      reasons.push(`moderate interest (${rate}%)`)
    }
  }

  if (debt.dueDate) {
    const days = daysUntil(debt.dueDate, now)
    if (days <= 7) {
      bump("high")
      reasons.push(days < 0 ? "payment overdue" : `due in ${days} day${days === 1 ? "" : "s"}`)
    } else if (days <= 30) {
      bump("medium")
      reasons.push(`due in ${days} days`)
    }
  }

  if (debt.lateFeeRisk === "high") {
    bump("high")
    reasons.push("high late-fee risk")
  } else if (debt.lateFeeRisk === "medium") {
    bump("medium")
    reasons.push("some late-fee risk")
  }

  if (debt.stressLevel === "high") {
    bump("high")
    reasons.push("high stress")
  }

  return { urgency, reasons }
}

export function computeFinancialModel(
  input: FinancialModelInput,
  now: Date = new Date()
): FinancialModelOutput {
  const monthlyIncome = input.income.monthlyAmount
  const safeIncome = monthlyIncome > 0 ? monthlyIncome : 0

  // Fixed commitment load — fixed expenses + subscriptions vs income.
  const fixedMonthly = sum(input.fixedExpenses.map((e) => e.amount)) + sum(input.subscriptions.map((s) => s.amount))
  const fixedRatio = safeIncome > 0 ? fixedMonthly / safeIncome : 0

  // Goal commitment load — total monthly saving needed across goals vs income.
  // Prefer an explicit monthlyContribution; otherwise derive it from the gap to
  // target spread over the months until the deadline (min 1 month so a due-now
  // goal doesn't divide by zero). A goal with no deadline and no explicit
  // contribution can't be spread, so it contributes 0 to the *monthly* load.
  const goalMonthly = sum(
    input.goals.map((goal) => {
      if (goal.monthlyContribution != null) return Math.max(0, goal.monthlyContribution)
      const remaining = Math.max(0, goal.targetAmount - goal.currentSavings)
      if (remaining === 0 || !goal.deadline) return 0
      const months = Math.max(1, Math.ceil(daysUntil(goal.deadline, now) / 30))
      return Math.round(remaining / months)
    })
  )
  const goalRatio = safeIncome > 0 ? goalMonthly / safeIncome : 0

  // Debt urgency — per-debt then rolled up to the worst.
  const perDebt: DebtUrgencyBreakdown[] = input.debts.map((debt, index) => {
    const { urgency, reasons } = classifyDebt(debt, now)
    return { index, urgency, reasons }
  })
  let overall: OverallDebtUrgency = input.debts.length === 0 ? "none" : "low"
  if (perDebt.some((d) => d.urgency === "high")) overall = "high"
  else if (perDebt.some((d) => d.urgency === "medium")) overall = "medium"

  return {
    incomePredictability: computeIncomePredictability(input.income),
    fixedCommitmentLoad: {
      ratio: Number(fixedRatio.toFixed(4)),
      monthlyAmount: fixedMonthly,
      band: classifyLoad(fixedRatio),
    },
    goalCommitmentLoad: {
      ratio: Number(goalRatio.toFixed(4)),
      monthlyAmount: goalMonthly,
      band: classifyLoad(goalRatio),
    },
    debtUrgency: {
      overall,
      totalOutstanding: sum(input.debts.map((d) => d.outstanding)),
      totalMinimumPayments: sum(input.debts.map((d) => d.minimumPayment ?? 0)),
      perDebt,
    },
  }
}
