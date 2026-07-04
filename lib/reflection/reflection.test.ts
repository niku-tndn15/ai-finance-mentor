import { describe, expect, it } from "vitest"

import { buildRecommendation, orderGoals } from "@/lib/coach"
import type { CoachGoal } from "@/lib/coach"
import type { FinancialModelInput } from "@/lib/financial-model"
import { buildWeeklyInsight, computeHabitProfile } from "@/lib/habit"
import type { HabitActionInput } from "@/lib/habit"

import { buildReflection } from "./generate"
import { pickChallenge } from "./challenge"
import type { ReflectionInput } from "./types"

const NOW = new Date(2026, 6, 7, 12)

function rec(actionKey: string, response: HabitActionInput["response"]): HabitActionInput {
  return { actionKey, category: "", response, createdAt: NOW }
}

function model(subscriptions = 0): FinancialModelInput {
  return {
    income: { monthlyAmount: 60000, payday: 25, stability: "high", plannedSavings: 5000 },
    fixedExpenses: [{ amount: 18000, negotiability: "non_negotiable" }],
    subscriptions: Array.from({ length: subscriptions }, () => ({ amount: 300 })),
    goals: [],
    debts: [],
  }
}

function makeInput(records: HabitActionInput[], goals?: CoachGoal[], subscriptions = 0): ReflectionInput {
  const g = goals ?? [{ id: "g1", name: "Emergency fund", category: "emergency_fund", targetAmount: 60000, currentSavings: 12000 }]
  const orderedGoals = orderGoals(g, NOW)
  const profile = computeHabitProfile(records)
  return {
    profile,
    goals: orderedGoals,
    recommendation: buildRecommendation(orderedGoals, [], { monthlyAmount: 30000, isNegative: false }),
    insight: buildWeeklyInsight(profile),
    model: model(subscriptions),
  }
}

describe("weekly reflection summary (§2)", () => {
  it("reports completions, what went well, and what slipped", () => {
    const input = makeInput([
      rec("goal-contribution:g1", "done"),
      rec("goal-contribution:g1", "done"),
      rec("goal-contribution:g1", "done"),
      rec("debt-due:d1", "skipped"),
    ])
    const r = buildReflection(input)
    expect(r.completed).toBe(3)
    expect(r.total).toBe(4)
    expect(r.summary).toMatch(/completed 3 of 4/i)
    expect(r.summary).toMatch(/strong on goal contributions/i)
    expect(r.summary).toMatch(/skipped debt payments/i)
  })

  it("handles a week with no activity gracefully", () => {
    const r = buildReflection(makeInput([]))
    expect(r.total).toBe(0)
    expect(r.summary).toMatch(/didn't log any/i)
  })
})

describe("pattern + next action + goal progress (§2)", () => {
  it("detects a repeated-skip pattern", () => {
    const r = buildReflection(makeInput([rec("weekend-limit", "skipped"), rec("weekend-limit", "skipped")]))
    expect(r.pattern).toMatch(/tend to skip weekend spending limits/i)
  })

  it("carries the coach's recommended action and its ActionRecord key", () => {
    const input = makeInput([])
    const r = buildReflection(input)
    expect(r.nextAction).toBe(input.recommendation!.action)
    expect(r.nextActionKey).toBe(input.recommendation!.actionKey)
  })

  it("summarises goal progress in plain language", () => {
    const r = buildReflection(makeInput([]))
    expect(r.goalProgress).toMatch(/Emergency fund: 20% complete/)
    expect(r.goalProgress).toMatch(/₹48,000 to go/)
  })
})

describe("challenge recommendation rules (§5)", () => {
  it("suggests a tiny daily save when saving nudges were skipped", () => {
    const p = computeHabitProfile([rec("goal-contribution:g1", "skipped")])
    expect(pickChallenge(p, model()).title).toMatch(/₹100 a day/i)
  })

  it("suggests a weekend cap when weekends were skipped", () => {
    const p = computeHabitProfile([rec("weekend-limit", "skipped")])
    expect(pickChallenge(p, model()).title).toMatch(/under ₹1,000 this weekend/i)
  })

  it("suggests a subscription cleanup when subscriptions are high", () => {
    const p = computeHabitProfile([])
    expect(pickChallenge(p, model(3)).title).toMatch(/cancel one unused subscription/i)
  })

  it("falls back to a small universal habit challenge", () => {
    const p = computeHabitProfile([])
    expect(pickChallenge(p, model(0)).title).toMatch(/wait 24 hours/i)
  })
})
