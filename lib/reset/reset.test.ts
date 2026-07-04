import { describe, expect, it } from "vitest"

import { buildRecommendation, orderGoals } from "@/lib/coach"
import type { CoachGoal } from "@/lib/coach"
import { computeSafeToUse } from "@/lib/financial-model"
import type { FinancialModelInput } from "@/lib/financial-model"
import { computeHabitProfile } from "@/lib/habit"
import type { HabitActionInput } from "@/lib/habit"

import { buildMonthlyReset } from "./generate"
import type { MonthlyResetInput } from "./types"

const NOW = new Date(2026, 6, 7, 12)

function rec(actionKey: string, response: HabitActionInput["response"]): HabitActionInput {
  return { actionKey, category: "", response, createdAt: NOW }
}

// A comfortable model (positive safe-to-use) with one big flexible expense.
function model(): FinancialModelInput {
  return {
    income: { monthlyAmount: 60000, payday: 25, stability: "high", plannedSavings: 5000 },
    fixedExpenses: [
      { amount: 18000, negotiability: "non_negotiable" },
      { amount: 4000, negotiability: "semi_negotiable" },
    ],
    subscriptions: [{ amount: 300 }],
    goals: [{ targetAmount: 60000, currentSavings: 12000 }],
    debts: [],
  }
}

function makeInput(
  records: HabitActionInput[],
  opts: { goals?: CoachGoal[]; flexibleCosts?: MonthlyResetInput["flexibleCosts"]; m?: FinancialModelInput } = {}
): MonthlyResetInput {
  const m = opts.m ?? model()
  const g = opts.goals ?? [{ id: "g1", name: "Emergency fund", category: "emergency_fund", targetAmount: 60000, currentSavings: 12000 }]
  const goals = orderGoals(g, NOW)
  const safe = computeSafeToUse(m, NOW)
  const recommendation = buildRecommendation(goals, [], { monthlyAmount: safe.monthlyAmount, isNegative: safe.isNegative })
  return {
    profile: computeHabitProfile(records),
    goals,
    recommendation,
    model: m,
    flexibleCosts: opts.flexibleCosts ?? [{ name: "Eating out", amount: 4000 }, { name: "Netflix", amount: 300 }],
    safe,
  }
}

describe("monthly reset — the six §3 questions", () => {
  it("names the biggest flexible cost as what hurt most (§3 example)", () => {
    const r = buildMonthlyReset(makeInput([]))
    expect(r.biggestLeak).toMatch(/Eating out/)
    expect(r.biggestLeak).toMatch(/₹4,000/)
    expect(r.summary).toMatch(/Eating out was your biggest flexible expense/i)
  })

  it("answers 'did I save enough?' from saving nudge history", () => {
    const saved = buildMonthlyReset(makeInput([rec("goal-contribution:g1", "done"), rec("payday-save", "done")]))
    expect(saved.savings).toMatch(/followed through on saving 2 times/i)

    const slipped = buildMonthlyReset(makeInput([rec("goal-contribution:g1", "skipped"), rec("goal-contribution:g1", "skipped")]))
    expect(slipped.savings).toMatch(/slipped this month/i)
  })

  it("answers 'did I overspend?' from spending discipline history", () => {
    const crept = buildMonthlyReset(makeInput([rec("weekend-limit", "skipped"), rec("safe-spend-day", "skipped")]))
    expect(crept.overspend).toMatch(/crept over your safe limit/i)

    const controlled = buildMonthlyReset(makeInput([rec("safe-spend-day", "done")]))
    expect(controlled.overspend).toMatch(/within your safe-to-use money/i)
  })

  it("reports goal movement in plain language", () => {
    const r = buildMonthlyReset(makeInput([]))
    expect(r.goalMovement).toMatch(/Emergency fund: 20% funded/)
    expect(r.goalMovement).toMatch(/₹48,000 to go/)
  })

  it("stays consistent with the M3 safe-to-use money for next month (§7)", () => {
    const input = makeInput([])
    const r = buildMonthlyReset(input)
    expect(r.safeToUseNextMonth).toBe(input.safe.monthlyAmount)
    expect(r.safeToUseSummary).toMatch(/safe-to-use money for next month/i)
  })

  it("recommends a concrete change and links it to ActionRecord storage", () => {
    const input = makeInput([])
    const r = buildMonthlyReset(input)
    // The coach recommendation drives the change when present.
    expect(r.nextAction).toBe(input.recommendation!.action)
    expect(r.nextActionKey).toBe(input.recommendation!.actionKey)
  })

  it("falls back to a 20% trim of the biggest flexible cost when the coach has no move", () => {
    const input = makeInput([])
    input.recommendation = null
    const r = buildMonthlyReset(input)
    expect(r.changeNextMonth).toMatch(/Reducing Eating out by about 20%/i)
    expect(r.changeNextMonth).toMatch(/₹800/) // 20% of ₹4,000
    expect(r.nextActionKey).toBe("reset-trim-flexible")
  })
})

describe("monthly reset — tight month (§6 sensitive state)", () => {
  it("stays calm and protects essentials when safe-to-use is negative", () => {
    const tight: FinancialModelInput = {
      income: { monthlyAmount: 20000, payday: 25, stability: "low", plannedSavings: 3000 },
      fixedExpenses: [{ amount: 22000, negotiability: "non_negotiable" }],
      subscriptions: [],
      goals: [{ targetAmount: 60000, currentSavings: 0 }],
      debts: [{ outstanding: 40000, minimumPayment: 3000 }],
    }
    const r = buildMonthlyReset(makeInput([], { m: tight, flexibleCosts: [] }))
    expect(r.safeToUseSummary).toMatch(/protecting essentials/i)
    expect(r.overspend).toMatch(/tight/i)
    expect(r.summary).not.toMatch(/fail|bad|terrible/i)
  })
})
