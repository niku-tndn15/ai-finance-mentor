import type { NudgeType } from "@/lib/nudge"

import type { MonthlyResetContent, MonthlyResetInput } from "./types"

// Milestone 8 — build the lightweight monthly reset deterministically (PRD 08
// §3). Pure. Derived from manual inputs + nudge history only (no transaction
// data in the MVP), and every money figure comes from the M3 safe-to-use engine
// so the reset stays consistent with safe-to-use money and goals (§7). AI (in
// persist) only rephrases `summary`.

// Behaviours that represent *saving* vs *spending discipline*, so we can answer
// "did I save enough?" and "did I overspend?" from nudge responses.
const SAVING_TYPES: NudgeType[] = ["payday", "goal"]
const SPENDING_TYPES: NudgeType[] = ["weekend", "safe_spend", "impulse"]

const TYPE_LABEL: Record<NudgeType, string> = {
  payday: "saving on payday",
  weekend: "weekend spending limits",
  subscription: "subscription cleanup",
  goal: "goal contributions",
  debt: "debt payments",
  impulse: "the 24-hour impulse pause",
  low_money: "protecting essentials",
  safe_spend: "staying within your safe spend",
}

const ALL_TYPES = Object.keys(TYPE_LABEL) as NudgeType[]

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`
}

function sumBy(profile: MonthlyResetInput["profile"], types: NudgeType[], key: "done" | "skip"): number {
  return types.reduce((n, t) => n + profile.perType[t][key], 0)
}

// The single most-skipped behaviour across all types, if any.
function mostSkipped(profile: MonthlyResetInput["profile"]): { type: NudgeType; count: number } | null {
  let best: { type: NudgeType; count: number } | null = null
  for (const t of ALL_TYPES) {
    const count = profile.perType[t].skip
    if (count > 0 && (!best || count > best.count)) best = { type: t, count }
  }
  return best
}

// The biggest movable cost the user entered (§3 example: "eating out was your
// biggest flexible expense"). Returns null when there's nothing flexible to trim.
function biggestFlexibleCost(flexibleCosts: MonthlyResetInput["flexibleCosts"]): { name: string; amount: number } | null {
  return [...flexibleCosts].sort((a, b) => b.amount - a.amount)[0] ?? null
}

export function buildMonthlyReset(input: MonthlyResetInput): MonthlyResetContent {
  const { profile, goals, recommendation, flexibleCosts, safe } = input

  const overspend = buildOverspend(input)
  const savings = buildSavings(input)
  const leak = biggestFlexibleCost(flexibleCosts)
  const biggestLeak = buildBiggestLeak(leak, profile)
  const goalMovement = buildGoalMovement(goals)

  // "What is my safe-to-use money for next month?" — straight from the M3 engine.
  const safeToUseNextMonth = safe.monthlyAmount
  const safeToUseSummary = safe.isNegative
    ? `Your must-pay costs are set to run ahead of your income next month, so the priority is protecting essentials.`
    : `Your safe-to-use money for next month is about ${inr(safe.monthlyAmount)}, after must-pay costs, planned savings, and debts.`

  // "What should I change next month?" — the coach's move, or a concrete cut of
  // the biggest flexible cost aimed at the top goal (mirrors the §3 example).
  const change = buildChange(recommendation, leak, goals)

  const savingSkips = sumBy(profile, SAVING_TYPES, "skip")
  const summary = buildSummary(savingSkips, leak, safe.isNegative)

  return {
    summary,
    overspend,
    savings,
    biggestLeak,
    goalMovement,
    changeNextMonth: change.text,
    safeToUseNextMonth,
    safeToUseSummary,
    nextAction: change.action,
    nextActionCategory: change.category,
    nextActionKey: change.actionKey,
  }
}

function buildOverspend(input: MonthlyResetInput): string {
  const { profile, safe } = input
  if (safe.isNegative || safe.zone === "red") {
    return "Money was tight — your must-pay costs ran close to or above your income plan this month."
  }
  const spendSkips = sumBy(profile, SPENDING_TYPES, "skip")
  if (spendSkips >= 2) {
    return `Spending crept over your safe limit on ${spendSkips} occasion${spendSkips === 1 ? "" : "s"}, especially around weekends.`
  }
  return "You mostly kept spending within your safe-to-use money — nice control."
}

function buildSavings(input: MonthlyResetInput): string {
  const { profile, model } = input
  const done = sumBy(profile, SAVING_TYPES, "done")
  const skip = sumBy(profile, SAVING_TYPES, "skip")

  if (done === 0 && skip === 0) {
    if (model.income.plannedSavings === 0) {
      return "You haven't set a planned savings amount yet, so saving depends on whatever's left over. Even ₹500 automatic helps."
    }
    return "You didn't log any saving actions this month — automating one small amount next month builds the habit."
  }
  if (done >= skip && done > 0) {
    return `You followed through on saving ${done} time${done === 1 ? "" : "s"} — steady progress.`
  }
  return `Saving slipped this month — it was skipped ${skip} time${skip === 1 ? "" : "s"}. Automating a small amount will make it stick.`
}

function buildBiggestLeak(leak: { name: string; amount: number } | null, profile: MonthlyResetInput["profile"]): string {
  if (leak) {
    return `Your biggest flexible cost was ${leak.name} at about ${inr(leak.amount)} a month — trimming it frees up the most room.`
  }
  const skip = mostSkipped(profile)
  if (skip && skip.count >= 2) {
    return `The behaviour that hurt most was skipping ${TYPE_LABEL[skip.type]} (${skip.count} times).`
  }
  return "No single cost or habit stood out as a big drain this month — a good sign."
}

function buildGoalMovement(goals: MonthlyResetInput["goals"]): string {
  const goal = goals.find((g) => g.remaining > 0) ?? goals[0]
  if (!goal) return "No goals set yet — add one so I can track what moves forward each month."
  const toGo = goal.remaining > 0 ? ` — ${inr(goal.remaining)} to go` : " — reached! 🎉"
  return `${goal.name}: ${goal.progressPercent}% funded${toGo}.`
}

function buildChange(
  recommendation: MonthlyResetInput["recommendation"],
  leak: { name: string; amount: number } | null,
  goals: MonthlyResetInput["goals"]
): { text: string; action: string; category: string; actionKey: string } {
  // Prefer the coach's highest-impact move so the reset stays consistent with
  // the rest of the app (§7).
  if (recommendation) {
    return {
      text: recommendation.action,
      action: recommendation.action,
      category: recommendation.category,
      actionKey: recommendation.actionKey,
    }
  }
  // Otherwise, a concrete cut of the biggest flexible cost aimed at the top goal.
  if (leak) {
    const freed = Math.max(100, Math.round((leak.amount * 0.2) / 100) * 100)
    const goal = goals.find((g) => g.remaining > 0)
    const toward = goal ? ` toward your ${goal.name}` : ""
    const text = `Reducing ${leak.name} by about 20% next month can free roughly ${inr(freed)}${toward}.`
    return { text, action: text, category: "general", actionKey: "reset-trim-flexible" }
  }
  const fallback = "Automate one small saving right after your next payday so it happens without thinking about it."
  return { text: fallback, action: fallback, category: "general", actionKey: "reset-next" }
}

function buildSummary(savingSkips: number, leak: { name: string; amount: number } | null, isNegative: boolean): string {
  if (isNegative) {
    return "Here's your reset for the month ahead — the focus is protecting essentials and easing the squeeze."
  }
  const lead = leak
    ? `Last month, ${leak.name} was your biggest flexible expense.`
    : "You kept your flexible spending in check last month."
  const save = savingSkips > 0 ? " Saving is the habit to tighten next month." : " Keep your saving streak going."
  return `${lead}${save} Here's your reset for the month ahead.`
}
