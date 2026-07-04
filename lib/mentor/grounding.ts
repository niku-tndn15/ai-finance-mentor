import { DEBT_TYPE_LABEL, DEBT_URGENCY_LABEL } from "@/lib/coach"

import type { MentorContext } from "./types"

// Milestone 7 — build the compact, real-data snapshot the AI answers from (PRD 07
// §1: grounded, never generic). Only user-provided/derived figures go in here, so
// the model has nothing to invent from. Pure.

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`
}

export function buildGrounding(ctx: MentorContext): string {
  const { safe, model, goals, debts, insight } = ctx
  const lines: string[] = []

  lines.push(`Monthly income: ${inr(model.income.monthlyAmount)} (payday day ${model.income.payday}).`)
  lines.push(
    `Safe-to-use this month: ${inr(safe.monthlyAmount)} — zone ${safe.zone}, confidence ${safe.confidence}.`
  )
  lines.push(`Safe to spend about ${inr(safe.dailySafeSpend)}/day, ${inr(safe.weeklySafeSpend)}/week.`)
  lines.push(`Protected (bills, savings, goals, debt): ${inr(safe.doNotTouch)}.`)
  lines.push(`Planned monthly savings: ${inr(model.income.plannedSavings)}.`)

  if (goals.length > 0) {
    const g = goals
      .slice(0, 3)
      .map((x) => `${x.name} (${x.progressPercent}% — ${inr(x.currentSavings)} of ${inr(x.targetAmount)})`)
      .join("; ")
    lines.push(`Goals, most important first: ${g}.`)
  } else {
    lines.push("No goals recorded.")
  }

  if (debts.length > 0) {
    const d = debts
      .slice(0, 3)
      .map((x) => {
        const rate = x.interestRate != null ? ` at ${x.interestRate}%` : ""
        const due = x.daysUntilDue != null ? `, due in ${x.daysUntilDue} days` : ""
        return `${DEBT_TYPE_LABEL[x.type]} ${inr(x.outstanding)}${rate}${due} (${DEBT_URGENCY_LABEL[x.urgency].toLowerCase()})`
      })
      .join("; ")
    lines.push(`Debts, most urgent first: ${d}.`)
  } else {
    lines.push("No debts recorded.")
  }

  if (insight.hasData) lines.push(`Habit signal: ${insight.headline} ${insight.strongest ?? ""}`.trim())

  return lines.join("\n")
}
