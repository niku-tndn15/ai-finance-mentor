import { computeFinancialModel } from "./compute"
import type { FinancialModelInput, Predictability } from "./types"

// Milestone 3 — Safe-to-Use Money Engine (PRD 03, in full). Pure functions over
// the Milestone 2 financial model input, so every branch is unit-testable with
// plain objects and an injectable `now`. All money is whole INR rupees.

export type MoneyZone = "green" | "yellow" | "red" | "locked"
export type ConfidenceLevel = "high" | "medium" | "low"

// Exact string PRD 03 §7 requires on every low-confidence output.
export const LOW_CONFIDENCE_DISCLAIMER =
  "This is a rough estimate based on what you have entered."

// Spending beyond your safe amount first eats into this cushion (the yellow
// band). Sized as a share of monthly income so it scales with the user.
const RISK_ZONE_INCOME_SHARE = 0.1

// Emergency buffer as a share of income, by income predictability. PRD 02 §2:
// low-stability income needs a stronger buffer + more conservative safe-spend.
// High-predictability salary earners reserve nothing extra here.
const EMERGENCY_BUFFER_SHARE: Record<Predictability, number> = {
  high: 0,
  medium: 0.05,
  low: 0.1,
}

export interface SafeToUseBreakdown {
  income: number
  fixedExpenses: number // fixed expenses + subscriptions
  plannedSavings: number
  goalCommitments: number
  debtPayments: number // sum of debt minimum payments
  emergencyBuffer: number
  committed: number // everything reserved = do-not-touch
}

export interface LowMoneyGuidance {
  message: string
  action: string
}

export interface SafeToUseResult {
  monthlyAmount: number // safe-to-use this month (may be negative)
  dailySafeSpend: number
  weeklySafeSpend: number
  weekendSafeSpend: number
  riskZoneAmount: number // size of the caution cushion (§3)
  doNotTouch: number // locked / protected money (§3)
  confidence: ConfidenceLevel
  zone: MoneyZone
  isNegative: boolean
  daysUntilPayday: number
  breakdown: SafeToUseBreakdown
  summary: string // plain-language monthly answer (§3)
  zoneMessage: string // Safe Spend Meter copy (§4)
  disclaimer?: string // present only when confidence is low (§7)
  lowMoneyGuidance?: LowMoneyGuidance // present when low/negative (§6)
}

function formatINR(amount: number): string {
  const abs = Math.abs(Math.round(amount)).toLocaleString("en-IN")
  return amount < 0 ? `-₹${abs}` : `₹${abs}`
}

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

// Whole days from `now` until the next occurrence of `payday` (day-of-month).
// If today is the payday, the user just got paid, so the next cycle is ~a month
// out. Payday is clamped to the month's last day (e.g. "31" in February).
export function daysUntilNextPayday(payday: number, now: Date): number {
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()

  const thisMonthPayday = Math.min(payday, lastDayOfMonth(year, month))
  let target: Date
  if (day < thisMonthPayday) {
    target = new Date(year, month, thisMonthPayday)
  } else {
    const nextPayday = Math.min(payday, lastDayOfMonth(year, month + 1))
    target = new Date(year, month + 1, nextPayday)
  }

  const startOfToday = new Date(year, month, day)
  const days = Math.round((target.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, days)
}

// Confidence (PRD 03 §7). Goals are required at setup so `hasGoals` is normally
// true; debts are optional, which is the usual high-vs-medium distinction.
function computeConfidence(input: FinancialModelInput): ConfidenceLevel {
  const hasIncome = input.income.monthlyAmount > 0
  const hasFixed = input.fixedExpenses.length > 0 || input.subscriptions.length > 0
  const hasGoals = input.goals.length > 0
  const hasDebts = input.debts.length > 0

  // Only income, or the big must-pay costs are missing → low.
  if (!hasIncome || !hasFixed) return "low"
  // Everything material entered → high.
  if (hasGoals && hasDebts) return "high"
  // Fixed costs present but goal/debt picture incomplete → medium.
  return "medium"
}

export function computeSafeToUse(
  input: FinancialModelInput,
  now: Date = new Date()
): SafeToUseResult {
  const model = computeFinancialModel(input, now)

  const income = Math.max(0, input.income.monthlyAmount)
  const fixedExpenses = model.fixedCommitmentLoad.monthlyAmount
  const plannedSavings = Math.max(0, input.income.plannedSavings)
  const goalCommitments = model.goalCommitmentLoad.monthlyAmount
  const debtPayments = model.debtUrgency.totalMinimumPayments
  const emergencyBuffer = Math.round(income * EMERGENCY_BUFFER_SHARE[model.incomePredictability])

  const committed = fixedExpenses + plannedSavings + goalCommitments + debtPayments + emergencyBuffer
  const monthlyAmount = income - committed
  const isNegative = monthlyAmount < 0

  const daysUntilPayday = daysUntilNextPayday(input.income.payday, now)
  const dailySafeSpend = isNegative ? 0 : Math.floor(monthlyAmount / daysUntilPayday)
  const weeklySafeSpend = isNegative ? 0 : Math.min(monthlyAmount, dailySafeSpend * 7)
  const weekendSafeSpend = isNegative ? 0 : dailySafeSpend * 2

  const riskZoneAmount = Math.round(income * RISK_ZONE_INCOME_SHARE)

  // Zone (PRD 03 §4/§5). Without live spend-tracking (a later milestone), the
  // meter reflects how much headroom the plan leaves: negative is red, a safe
  // amount thinner than the caution cushion is yellow, otherwise green.
  let zone: MoneyZone
  if (isNegative) zone = "red"
  else if (monthlyAmount <= riskZoneAmount) zone = "yellow"
  else zone = "green"

  const confidence = computeConfidence(input)

  return {
    monthlyAmount,
    dailySafeSpend,
    weeklySafeSpend,
    weekendSafeSpend,
    riskZoneAmount,
    doNotTouch: committed,
    confidence,
    zone,
    isNegative,
    daysUntilPayday,
    breakdown: {
      income,
      fixedExpenses,
      plannedSavings,
      goalCommitments,
      debtPayments,
      emergencyBuffer,
      committed,
    },
    summary: buildSummary(monthlyAmount, zone),
    zoneMessage: buildZoneMessage(zone, dailySafeSpend),
    disclaimer: confidence === "low" ? LOW_CONFIDENCE_DISCLAIMER : undefined,
    lowMoneyGuidance: zone === "green" ? undefined : buildLowMoneyGuidance(input, isNegative),
  }
}

// Plain-language monthly answer, tone per PRD 03 §3 example.
function buildSummary(monthlyAmount: number, zone: MoneyZone): string {
  if (zone === "red") {
    return "Your must-pay money is higher than your current income plan this month. Let's protect essentials first."
  }
  return `You can safely use ${formatINR(monthlyAmount)} this month without disturbing your bills, savings, and goals.`
}

// Safe Spend Meter copy, matching the PRD 03 §4 examples.
function buildZoneMessage(zone: MoneyZone, dailySafeSpend: number): string {
  switch (zone) {
    case "green":
      return `You are in the green zone. You can spend ${formatINR(dailySafeSpend)} today safely.`
    case "yellow":
      return `You are entering the yellow zone. Spending more than ${formatINR(dailySafeSpend)} today may affect your goals.`
    case "red":
      return "You are in the red zone. Extra spending now may affect your bills, debt, or savings."
    case "locked":
      return "This money is reserved for bills, debt, and savings — not safe to spend."
  }
}

// One concrete, calm action for low/negative safe-to-use (PRD 03 §6): prefer
// trimming a semi-negotiable cost, then planned savings, then a goal timeline.
function buildLowMoneyGuidance(input: FinancialModelInput, isNegative: boolean): LowMoneyGuidance {
  const message = isNegative
    ? "Your must-pay money is higher than your current income plan. Let's protect essentials first and review one flexible expense today."
    : "Your safe-to-use money is thin this month. Focus on essentials, and free up a little breathing room."

  const flexible = [
    ...input.fixedExpenses
      .filter((e) => e.negotiability === "semi_negotiable")
      .map((e) => ({ name: "expense", amount: e.amount })),
    ...input.subscriptions.map((s) => ({ name: "subscription", amount: s.amount })),
  ].sort((a, b) => b.amount - a.amount)[0]

  let action: string
  if (flexible) {
    action = `Review your ${formatINR(flexible.amount)} flexible ${flexible.name} — trimming it frees up safe-to-use money right away.`
  } else if (input.income.plannedSavings > 0) {
    action = `Consider easing your ${formatINR(input.income.plannedSavings)} planned savings a little this month, then restore it next payday.`
  } else {
    action = "Consider extending one goal's timeline to lower the monthly amount it needs."
  }

  return { message, action }
}
