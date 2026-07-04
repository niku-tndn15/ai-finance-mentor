import { describe, expect, it } from "vitest"

import { orderDebts, orderGoals } from "@/lib/coach"
import type { CoachDebt, CoachGoal } from "@/lib/coach"
import { computeSafeToUse } from "@/lib/financial-model"
import type { FinancialModelInput } from "@/lib/financial-model"

import { generateCandidates, scoreNudge, selectNudge } from "./engine"
import type { NudgeContext } from "./types"

// Local-time date constructors so getDay()/getDate() are deterministic across the
// runner's timezone. July 2026: 4th = Saturday, 6th = Monday, 7th = Tuesday.
const SAT = new Date(2026, 6, 4, 12)
const MON = new Date(2026, 6, 6, 12)
const TUE = new Date(2026, 6, 7, 12)

interface Fixture {
  now?: Date
  monthlyIncome?: number
  fixed?: number
  plannedSavings?: number
  payday?: number
  subscriptions?: number
  goals?: CoachGoal[]
  debts?: CoachDebt[]
  suppressedTypes?: NudgeContext["suppressedTypes"]
  preferSmallerSaves?: boolean
}

function context(f: Fixture = {}): NudgeContext {
  const now = f.now ?? TUE
  const goals = f.goals ?? [{ id: "g1", name: "Emergency fund", category: "emergency_fund", targetAmount: 60000, currentSavings: 12000 }]
  const debts = f.debts ?? []
  const payday = f.payday ?? 25

  const model: FinancialModelInput = {
    income: { monthlyAmount: f.monthlyIncome ?? 60000, payday, stability: "high", plannedSavings: f.plannedSavings ?? 5000 },
    fixedExpenses: f.fixed != null ? [{ amount: f.fixed, negotiability: "non_negotiable" }] : [{ amount: 18000, negotiability: "non_negotiable" }],
    subscriptions: Array.from({ length: f.subscriptions ?? 0 }, () => ({ amount: 300 })),
    goals: goals.map((g) => ({ targetAmount: g.targetAmount, currentSavings: g.currentSavings, deadline: g.deadline, monthlyContribution: g.monthlyContribution })),
    debts: debts.map((d) => ({ outstanding: d.outstanding, interestRate: d.interestRate, minimumPayment: d.minimumPayment, dueDate: d.dueDate, lateFeeRisk: d.lateFeeRisk, stressLevel: d.stressLevel })),
  }

  return {
    payday,
    subscriptionsCount: f.subscriptions ?? 0,
    goals: orderGoals(goals, now),
    debts: orderDebts(debts, now),
    safe: computeSafeToUse(model, now),
    now,
    suppressedTypes: f.suppressedTypes,
    preferSmallerSaves: f.preferSmallerSaves,
  }
}

describe("trigger priority selection (§4)", () => {
  it("picks a debt due soon first (rank 1)", () => {
    const nudge = selectNudge(context({ debts: [{ id: "d1", type: "credit_card", outstanding: 24000, minimumPayment: 2000, dueDate: new Date(2026, 6, 10), lateFeeRisk: "high" }] }))
    expect(nudge?.type).toBe("debt")
    expect(nudge?.urgencyRank).toBe(1)
    expect(nudge?.action).toMatch(/late fee/i)
  })

  it("picks low-money guidance when safe-to-use is negative (rank 2)", () => {
    const nudge = selectNudge(context({ monthlyIncome: 20000, fixed: 25000 }))
    expect(nudge?.type).toBe("low_money")
    expect(nudge?.urgencyRank).toBe(2)
  })

  it("picks the payday nudge just after payday (rank 3)", () => {
    const nudge = selectNudge(context({ now: TUE, payday: 7 }))
    expect(nudge?.type).toBe("payday")
    expect(nudge?.urgencyRank).toBe(3)
  })

  it("picks the goal nudge on an ordinary day with money spare (rank 5)", () => {
    const nudge = selectNudge(context({ now: TUE }))
    expect(nudge?.type).toBe("goal")
    expect(nudge?.urgencyRank).toBe(5)
  })

  it("picks the weekend nudge on a weekend when no goal is pending (rank 6)", () => {
    const nudge = selectNudge(context({ now: SAT, goals: [{ id: "g1", name: "Emergency fund", category: "emergency_fund", targetAmount: 10000, currentSavings: 10000 }] }))
    expect(nudge?.type).toBe("weekend")
    expect(nudge?.urgencyRank).toBe(6)
  })

  it("falls back to the general safe-spend nudge when nothing else applies (rank 9)", () => {
    const nudge = selectNudge(context({ now: TUE, goals: [{ id: "g1", name: "Emergency fund", category: "emergency_fund", targetAmount: 10000, currentSavings: 10000 }] }))
    expect(nudge?.type).toBe("safe_spend")
    expect(nudge?.urgencyRank).toBe(9)
  })

  it("surfaces the impulse habit challenge on Mondays", () => {
    const nudge = selectNudge(context({ now: MON, goals: [{ id: "g1", name: "Emergency fund", category: "emergency_fund", targetAmount: 10000, currentSavings: 10000 }] }))
    expect(nudge?.type).toBe("impulse")
  })
})

describe("habit-learning adaptation (M6 wiring)", () => {
  it("suppresses a repeatedly-skipped soft nudge so a different one surfaces", () => {
    // Ordinary day would pick the goal nudge (rank 5); suppressing it drops to
    // the safe-spend fallback (rank 9).
    const nudge = selectNudge(context({ now: TUE, suppressedTypes: ["goal", "payday"] }))
    expect(nudge?.type).toBe("safe_spend")
  })

  it("asks for a smaller save amount when the habit model prefers it (§5)", () => {
    const normal = selectNudge(context({ now: TUE }))
    const smaller = selectNudge(context({ now: TUE, preferSmallerSaves: true }))
    const amountOf = (s?: string) => Number((s ?? "").replace(/[^\d]/g, ""))
    expect(normal?.type).toBe("goal")
    expect(smaller?.type).toBe("goal")
    expect(amountOf(smaller?.action)).toBeLessThan(amountOf(normal?.action))
  })
})

describe("nudge anatomy (§5)", () => {
  it("every candidate carries trigger, action, reason, and expected benefit", () => {
    for (const c of generateCandidates(context({ now: MON, subscriptions: 3 }))) {
      expect(c.trigger.length).toBeGreaterThan(0)
      expect(c.action.length).toBeGreaterThan(0)
      expect(c.reason.length).toBeGreaterThan(0)
      expect(c.expectedBenefit.length).toBeGreaterThan(0)
      expect(c.actionKey.length).toBeGreaterThan(0)
    }
  })
})

describe("scoring combines urgency, readiness, impact (§2)", () => {
  const base = context()

  it("weights urgency so a more-urgent nudge always outranks a less-urgent one", () => {
    const urgent = scoreNudge({ type: "debt", urgencyRank: 1, trigger: "", action: "", reason: "", expectedBenefit: "", actionKey: "k", category: "debt", readiness: 0, impact: 0 }, base)
    const lessUrgent = scoreNudge({ type: "goal", urgencyRank: 2, trigger: "", action: "", reason: "", expectedBenefit: "", actionKey: "k", category: "goal", readiness: 1, impact: 1 }, base)
    expect(urgent.score).toBeGreaterThan(lessUrgent.score)
  })

  it("uses impact and readiness to separate equal-urgency candidates", () => {
    const high = scoreNudge({ type: "goal", urgencyRank: 5, trigger: "", action: "", reason: "", expectedBenefit: "", actionKey: "k", category: "goal", readiness: 0.9, impact: 0.9 }, base)
    const low = scoreNudge({ type: "goal", urgencyRank: 5, trigger: "", action: "", reason: "", expectedBenefit: "", actionKey: "k", category: "goal", readiness: 0.1, impact: 0.1 }, base)
    expect(high.score).toBeGreaterThan(low.score)
  })

  it("lets a readinessHint (M6 hook) override the template readiness", () => {
    const withHint = { ...base, readinessHint: { goal: 0.05 } }
    const scored = scoreNudge({ type: "goal", urgencyRank: 5, trigger: "", action: "", reason: "", expectedBenefit: "", actionKey: "k", category: "goal", readiness: 0.9, impact: 0.5 }, withHint)
    expect(scored.readiness).toBe(0.05)
  })
})
