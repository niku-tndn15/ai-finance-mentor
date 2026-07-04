import type { CoachDebt, CoachDebtView, DebtTypeValue, DebtUrgency } from "./types"

// Milestone 4 — Debt urgency classifier (PRD 04 §5). Pure functions over
// CoachDebt with an injectable `now` so due-date maths is deterministic.

const RANK: Record<DebtUrgency, number> = { lower: 0, medium: 1, highest: 2 }
const BY_RANK: DebtUrgency[] = ["lower", "medium", "highest"]

// Base urgency by debt type (PRD 04 §5). Cards and BNPL are short-term,
// penalty-heavy revolving debt → highest by default. Personal loans and informal
// borrowing ("emotional pressure") → medium. Education/vehicle loans are lower
// unless a due date or late-fee signal below raises them.
const BASE_BY_TYPE: Record<DebtTypeValue, DebtUrgency> = {
  credit_card: "highest",
  bnpl: "highest",
  personal_loan: "medium",
  informal: "medium",
  education_loan: "lower",
  vehicle_loan: "lower",
  other: "lower",
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

export function classifyDebt(debt: CoachDebt, now: Date = new Date()): CoachDebtView {
  const reasons: string[] = []
  let urgency: DebtUrgency = BASE_BY_TYPE[debt.type]

  // Worst-driver-wins: any signal can only raise urgency, never lower it.
  const bump = (level: DebtUrgency) => {
    if (RANK[level] > RANK[urgency]) urgency = level
  }

  // Type is itself a driver worth surfacing when it already sets a high base.
  if (debt.type === "credit_card") reasons.push("credit card debt")
  else if (debt.type === "bnpl") reasons.push("short-term dues with penalties")
  else if (debt.type === "informal") reasons.push("informal borrowing")

  const rate = debt.interestRate ?? null
  if (rate !== null) {
    if (rate >= 24) {
      bump("highest")
      reasons.push(`high interest (${rate}%)`)
    } else if (rate >= 12) {
      bump("medium")
      reasons.push(`moderate interest (${rate}%)`)
    }
  }

  let daysUntilDue: number | null = null
  if (debt.dueDate) {
    daysUntilDue = daysBetween(now, debt.dueDate)
    if (daysUntilDue <= 7) {
      bump("highest")
      reasons.push(daysUntilDue < 0 ? "payment overdue" : `due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`)
    } else if (daysUntilDue <= 30) {
      bump("medium")
      reasons.push(`due in ${daysUntilDue} days`)
    }
  }

  if (debt.lateFeeRisk === "high") {
    bump("highest")
    reasons.push("high late-fee risk")
  } else if (debt.lateFeeRisk === "medium") {
    bump("medium")
    reasons.push("some late-fee risk")
  }

  if (debt.stressLevel === "high") {
    bump("medium")
    reasons.push("high stress")
  }

  return { ...debt, urgency, reasons, daysUntilDue }
}

// Highest urgency first, then soonest due date, then higher interest.
export function orderDebts(debts: CoachDebt[], now: Date = new Date()): CoachDebtView[] {
  return debts
    .map((d) => classifyDebt(d, now))
    .sort((a, b) => {
      const byUrgency = RANK[b.urgency] - RANK[a.urgency]
      if (byUrgency !== 0) return byUrgency

      const aDue = a.dueDate ? a.dueDate.getTime() : Infinity
      const bDue = b.dueDate ? b.dueDate.getTime() : Infinity
      if (aDue !== bDue) return aDue - bDue

      return (b.interestRate ?? 0) - (a.interestRate ?? 0)
    })
}

// Exposed for tests / callers that want to compare urgency levels numerically.
export function urgencyRank(urgency: DebtUrgency): number {
  return RANK[urgency]
}

export { BY_RANK as DEBT_URGENCY_ORDER }
