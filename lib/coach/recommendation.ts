import type { CoachDebtView, CoachGoalView, CoachRecommendation } from "./types"

// Milestone 4 — Save-vs-debt guidance (PRD 04 §6). Produces the single
// recommended goal/debt action (PRD 04 §8) from the ordered goals, ordered
// debts, and the user's safe-to-use money. Pure — no DB, no clock.
//
// Guidance stays action-oriented on the user's *own* money (pay this debt, move
// this to that goal). It never names a product, lender, or investment, so it
// can't stray into regulated credit/investment advice (PRD 04 §8, PRD 09 §4).

export interface SafeSummary {
  monthlyAmount: number // safe-to-use this month (may be negative)
  isNegative: boolean
}

function formatINR(amount: number): string {
  return `₹${Math.max(0, Math.round(amount)).toLocaleString("en-IN")}`
}

// A modest, non-aggressive slice of safe money to suggest putting to work, so the
// recommendation never tells the user to spend everything they have spare.
function suggestedSlice(safeMonthly: number): number {
  return Math.max(0, Math.round((safeMonthly * 0.3) / 100) * 100)
}

function isHighInterest(debt: CoachDebtView): boolean {
  return debt.urgency === "highest" && (debt.type === "credit_card" || debt.type === "bnpl" || (debt.interestRate ?? 0) >= 24)
}

export function buildRecommendation(
  goals: CoachGoalView[],
  debts: CoachDebtView[],
  safe: SafeSummary
): CoachRecommendation | null {
  const topDebt = debts[0] // debts arrive pre-ordered (highest urgency first)
  const highInterestDebt = debts.find(isHighInterest)
  const emergencyGoal = goals.find((g) => g.category === "emergency_fund")
  const hasFundedEmergency = !!emergencyGoal && emergencyGoal.remaining === 0

  // 1. Payment due soon → avoid late fees first, whatever the money picture (§6).
  //    This is a must-pay, so it outranks the tight-money guard below.
  if (topDebt && topDebt.daysUntilDue != null && (topDebt.daysUntilDue <= 7 || topDebt.lateFeeRisk === "high")) {
    const overdue = topDebt.daysUntilDue < 0
    const min = topDebt.minimumPayment ?? 0
    const amountText = min > 0 ? ` of at least ${formatINR(min)}` : ""
    return {
      kind: "debt_due_soon",
      category: "debt",
      actionKey: `debt-due:${topDebt.id}`,
      debtId: topDebt.id,
      title: overdue ? "Clear an overdue payment" : "A payment is due soon",
      action: `Make a payment${amountText} on your ${debtLabel(topDebt)} ${overdue ? "now" : "before it's due"} to avoid a late fee.`,
      reason: overdue
        ? "It's past due, so paying now stops late fees and extra interest from building up."
        : "Paying before the due date avoids a late fee, which is usually the cheapest win available.",
    }
  }

  // 2. Money is tight this month → protect essentials, don't push extra (§6).
  if (safe.isNegative || safe.monthlyAmount <= 0) {
    return {
      kind: "protect_essentials",
      category: "save_vs_debt",
      actionKey: "protect-essentials",
      title: "Cover essentials first",
      action: "This month, cover only your essentials and the minimum on each debt — hold off on extra savings or extra debt payments.",
      reason: "Your safe-to-use money is tight right now, so protecting essentials matters more than getting ahead.",
    }
  }

  const slice = suggestedSlice(safe.monthlyAmount)

  // 3. No funded emergency fund + a high-interest debt → balance a small buffer
  //    with debt payoff (§6 first default rule).
  if (!hasFundedEmergency && highInterestDebt) {
    const each = Math.max(0, Math.round(slice / 2))
    const split = each > 0 ? ` About ${formatINR(each)} to each is a balanced start.` : ""
    return {
      kind: "balance_buffer_and_debt",
      category: "save_vs_debt",
      actionKey: `balance:${highInterestDebt.id}`,
      debtId: highInterestDebt.id,
      goalId: emergencyGoal?.id,
      title: "Balance a buffer with debt payoff",
      action: `Split your spare money this month between a small emergency buffer and your ${debtLabel(highInterestDebt)}.${split}`,
      reason: "A thin buffer keeps a surprise expense from becoming new debt, while chipping at high-interest debt saves you the most on interest.",
    }
  }

  // 4. High-interest debt, no urgent due date → extra payment while safe money
  //    allows (§6 third default rule).
  if (highInterestDebt && slice > 0) {
    return {
      kind: "extra_debt_payment",
      category: "debt",
      actionKey: `debt-payoff:${highInterestDebt.id}`,
      debtId: highInterestDebt.id,
      title: "Get ahead on your costliest debt",
      action: `Put about ${formatINR(slice)} extra toward your ${debtLabel(highInterestDebt)} this month.`,
      reason: "It carries the highest interest, so paying it down early saves you more than any other debt right now.",
    }
  }

  // 5. No pressing debt → move the top-priority goal forward (§3 ordering already
  //    put emergency fund first).
  const topGoal = goals.find((g) => g.remaining > 0)
  if (topGoal) {
    const amount = topGoal.requiredMonthlyContribution ?? slice
    const amountText = amount > 0 ? ` of about ${formatINR(amount)}` : ""
    return {
      kind: "fund_goal",
      category: "goal",
      actionKey: `goal-contribution:${topGoal.id}`,
      goalId: topGoal.id,
      title: `Move your ${topGoal.name} forward`,
      action: `Add a contribution${amountText} to your ${topGoal.name} this month.`,
      reason: `You're ${topGoal.progressPercent}% there, and this is your highest-priority goal right now.`,
    }
  }

  return null
}

// Plain, non-jargon debt names for copy.
const DEBT_LABEL: Record<CoachDebtView["type"], string> = {
  credit_card: "credit card",
  personal_loan: "personal loan",
  education_loan: "education loan",
  vehicle_loan: "vehicle loan",
  bnpl: "pay-later balance",
  informal: "personal borrowing",
  other: "debt",
}

function debtLabel(debt: CoachDebtView): string {
  return DEBT_LABEL[debt.type]
}
