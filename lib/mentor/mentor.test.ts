import { describe, expect, it } from "vitest"

import { buildRecommendation, orderDebts, orderGoals } from "@/lib/coach"
import type { CoachDebt, CoachGoal } from "@/lib/coach"
import { computeSafeToUse } from "@/lib/financial-model"
import type { FinancialModelInput } from "@/lib/financial-model"
import { buildWeeklyInsight, computeHabitProfile } from "@/lib/habit"

import { computeAffordability } from "./affordability"
import { detectIntent, parseAmount } from "./intent"
import { buildBaseAnswer } from "./fallback"
import type { MentorContext } from "./types"

const NOW = new Date(2026, 6, 7, 12)

function makeCtx(f: {
  income?: number
  fixed?: number
  plannedSavings?: number
  goals?: CoachGoal[]
  debts?: CoachDebt[]
  subscriptions?: number
} = {}): MentorContext {
  const goals = f.goals ?? [{ id: "g1", name: "Emergency fund", category: "emergency_fund", targetAmount: 60000, currentSavings: 12000 }]
  const debts = f.debts ?? []
  const model: FinancialModelInput = {
    income: { monthlyAmount: f.income ?? 60000, payday: 25, stability: "high", plannedSavings: f.plannedSavings ?? 5000 },
    fixedExpenses: f.fixed != null ? [{ amount: f.fixed, negotiability: "non_negotiable" }] : [{ amount: 18000, negotiability: "non_negotiable" }],
    subscriptions: Array.from({ length: f.subscriptions ?? 0 }, () => ({ amount: 300 })),
    goals: goals.map((g) => ({ targetAmount: g.targetAmount, currentSavings: g.currentSavings, deadline: g.deadline, monthlyContribution: g.monthlyContribution })),
    debts: debts.map((d) => ({ outstanding: d.outstanding, interestRate: d.interestRate, minimumPayment: d.minimumPayment, dueDate: d.dueDate, lateFeeRisk: d.lateFeeRisk, stressLevel: d.stressLevel })),
  }
  const safe = computeSafeToUse(model, NOW)
  const orderedGoals = orderGoals(goals, NOW)
  const orderedDebts = orderDebts(debts, NOW)
  return {
    safe,
    model,
    goals: orderedGoals,
    debts: orderedDebts,
    recommendation: buildRecommendation(orderedGoals, orderedDebts, { monthlyAmount: safe.monthlyAmount, isNegative: safe.isNegative }),
    insight: buildWeeklyInsight(computeHabitProfile([])),
  }
}

describe("amount parsing", () => {
  it("reads rupee amounts in several forms", () => {
    expect(parseAmount("Can I spend ₹4,000 today?")).toBe(4000)
    expect(parseAmount("spend 4k on shoes")).toBe(4000)
    expect(parseAmount("a 2 lakh car")).toBe(200000)
    expect(parseAmount("how much should I save?")).toBeNull()
  })
})

describe("intent detection (§2 question set)", () => {
  const cases: Array<[string, string]> = [
    ["Can I spend ₹4,000 on shopping today?", "affordability"],
    ["How much should I save this week?", "save_this_week"],
    ["What is the one thing I should fix first?", "fix_first"],
    ["Why am I not saving enough?", "why_not_saving"],
    ["Should I pay debt or save first?", "save_vs_debt"],
    ["How do I reduce spending without feeling restricted?", "reduce_spending"],
  ]
  it.each(cases)("routes %j to %s", (q, expected) => {
    expect(detectIntent(q).intent).toBe(expected)
  })

  it("extracts the amount for an affordability question", () => {
    expect(detectIntent("Can I spend ₹4,000 on shopping today?").amount).toBe(4000)
  })
})

describe("affordability verdicts (§4)", () => {
  // income 60000 − fixed 18000 − planned 5000 = 37000 safe; risk cushion 6000 → comfortable 31000.
  const safe = makeCtx().safe

  it("safe to buy when it fits within the comfortable amount", () => {
    expect(computeAffordability(5000, safe).verdict).toBe("safe_to_buy")
  })

  it("still yes but with a tradeoff when it eats the cushion", () => {
    const r = computeAffordability(35000, safe)
    expect(r.verdict).toBe("safe_to_buy")
    expect(r.answer).toMatch(/yellow zone/i)
  })

  it("suggests buying in parts when it exceeds this month's safe money", () => {
    expect(computeAffordability(50000, safe).verdict).toBe("buy_in_parts")
  })

  it("suggests buying later for a purchase well beyond means", () => {
    expect(computeAffordability(120000, safe).verdict).toBe("buy_later")
  })

  it("says avoid for now when safe-to-use money is negative", () => {
    const tight = makeCtx({ income: 20000, fixed: 25000 }).safe
    expect(computeAffordability(4000, tight).verdict).toBe("avoid_for_now")
  })
})

describe("deterministic base answers (§2 / §6 / §7)", () => {
  it("asks for the amount when an affordability question omits it", () => {
    const base = buildBaseAnswer("affordability", null, makeCtx())
    expect(base.assumptions).toBeTruthy()
    expect(base.nextAction).toMatch(/amount/i)
  })

  it("gives a weekly saving target referencing the goal", () => {
    const base = buildBaseAnswer("save_this_week", null, makeCtx())
    expect(base.answer).toMatch(/Emergency fund/)
    expect(base.nextAction).toMatch(/₹/)
  })

  it("routes fix-first through the coach recommendation when one exists", () => {
    const ctx = makeCtx({ debts: [{ id: "d1", type: "credit_card", outstanding: 24000, minimumPayment: 2000, dueDate: new Date(2026, 6, 9), lateFeeRisk: "high" }] })
    const base = buildBaseAnswer("fix_first", null, ctx)
    expect(base.nextAction).toBe(ctx.recommendation!.action)
  })

  it("explains no planned savings for why-not-saving", () => {
    const base = buildBaseAnswer("why_not_saving", null, makeCtx({ plannedSavings: 0 }))
    expect(base.answer).toMatch(/planned savings/i)
  })

  it("suggests a subscription cut for reduce-spending", () => {
    const base = buildBaseAnswer("reduce_spending", null, makeCtx({ subscriptions: 3 }))
    expect(base.nextAction).toMatch(/subscription/i)
  })

  it("gives a helpful menu for an unrecognised question", () => {
    const base = buildBaseAnswer("unknown", null, makeCtx())
    expect(base.answer.length).toBeGreaterThan(0)
    expect(base.nextAction).toMatch(/spend/i)
  })
})
