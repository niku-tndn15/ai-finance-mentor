import { describe, expect, it } from "vitest"

import { buildGoalView, orderGoals } from "./goal-coach"
import { classifyDebt, orderDebts } from "./debt-coach"
import { buildRecommendation } from "./recommendation"
import type { CoachDebt, CoachGoal } from "./types"

// Fixed "now" so due-date / deadline maths is deterministic.
const NOW = new Date("2026-07-03T00:00:00Z")

function goal(overrides: Partial<CoachGoal> = {}): CoachGoal {
  return {
    id: "g1",
    name: "Emergency fund",
    category: "emergency_fund",
    targetAmount: 60000,
    currentSavings: 12000,
    ...overrides,
  }
}

function debt(overrides: Partial<CoachDebt> = {}): CoachDebt {
  return { id: "d1", type: "credit_card", outstanding: 24000, ...overrides }
}

describe("goal progress + required contribution (§2)", () => {
  it("computes clamped progress percent and remaining", () => {
    const view = buildGoalView(goal({ targetAmount: 60000, currentSavings: 12000 }), NOW)
    expect(view.progressPercent).toBe(20)
    expect(view.remaining).toBe(48000)
  })

  it("caps progress at 100 and reports the goal as reached", () => {
    const view = buildGoalView(goal({ targetAmount: 5000, currentSavings: 9000 }), NOW)
    expect(view.progressPercent).toBe(100)
    expect(view.remaining).toBe(0)
    expect(view.requiredMonthlyContribution).toBe(0)
    expect(view.note).toMatch(/reached/i)
  })

  it("spreads the remaining amount over months to the deadline", () => {
    // ~3 months out: 48000 / 3 = 16000.
    const view = buildGoalView(
      goal({ targetAmount: 60000, currentSavings: 12000, deadline: new Date("2026-10-01T00:00:00Z") }),
      NOW
    )
    expect(view.monthsToDeadline).toBe(3)
    expect(view.requiredMonthlyContribution).toBe(16000)
  })

  it("prefers an explicit monthlyContribution over the derived one", () => {
    const view = buildGoalView(
      goal({ deadline: new Date("2026-10-01T00:00:00Z"), monthlyContribution: 2000 }),
      NOW
    )
    expect(view.requiredMonthlyContribution).toBe(2000)
  })

  it("has no required contribution when there is no deadline or explicit amount", () => {
    const view = buildGoalView(goal({ deadline: null, monthlyContribution: null }), NOW)
    expect(view.requiredMonthlyContribution).toBeNull()
  })
})

describe("goal priority ordering (§3)", () => {
  it("orders by default category rank: emergency → essential → time-bound → lifestyle → investing", () => {
    const ordered = orderGoals(
      [
        goal({ id: "invest", name: "Investing", category: "investing" }),
        goal({ id: "life", name: "Vacation", category: "lifestyle" }),
        goal({ id: "ef", name: "Emergency fund", category: "emergency_fund" }),
        goal({ id: "ess", name: "School fees", category: "essential_obligation" }),
      ],
      NOW
    )
    expect(ordered.map((g) => g.id)).toEqual(["ef", "ess", "life", "invest"])
  })

  it("lets a user priority override the default ordering", () => {
    const ordered = orderGoals(
      [
        goal({ id: "ef", category: "emergency_fund" }),
        goal({ id: "life", category: "lifestyle", priority: 1 }),
      ],
      NOW
    )
    expect(ordered[0].id).toBe("life")
  })
})

describe("debt urgency classifier (§5)", () => {
  it("bases credit cards and BNPL at highest urgency", () => {
    expect(classifyDebt(debt({ type: "credit_card" }), NOW).urgency).toBe("highest")
    expect(classifyDebt(debt({ type: "bnpl" }), NOW).urgency).toBe("highest")
  })

  it("treats personal loans and informal borrowing as medium", () => {
    expect(classifyDebt(debt({ type: "personal_loan" }), NOW).urgency).toBe("medium")
    expect(classifyDebt(debt({ type: "informal" }), NOW).urgency).toBe("medium")
  })

  it("keeps education/vehicle loans lower unless due soon", () => {
    expect(classifyDebt(debt({ type: "education_loan" }), NOW).urgency).toBe("lower")
    const dueSoon = classifyDebt(
      debt({ type: "education_loan", dueDate: new Date("2026-07-06T00:00:00Z") }),
      NOW
    )
    expect(dueSoon.urgency).toBe("highest")
  })

  it("raises urgency for an overdue payment and flags it", () => {
    const view = classifyDebt(
      debt({ type: "vehicle_loan", dueDate: new Date("2026-07-01T00:00:00Z") }),
      NOW
    )
    expect(view.urgency).toBe("highest")
    expect(view.reasons.join(" ")).toMatch(/overdue/)
  })

  it("orders highest-urgency debts first", () => {
    const ordered = orderDebts(
      [
        debt({ id: "edu", type: "education_loan" }),
        debt({ id: "card", type: "credit_card" }),
        debt({ id: "pl", type: "personal_loan" }),
      ],
      NOW
    )
    expect(ordered.map((d) => d.id)).toEqual(["card", "pl", "edu"])
  })
})

describe("save-vs-debt recommendation (§6)", () => {
  const safeHealthy = { monthlyAmount: 10000, isNegative: false }

  it("prioritises avoiding a late fee when a payment is due soon", () => {
    const debts = orderDebts([debt({ dueDate: new Date("2026-07-05T00:00:00Z"), minimumPayment: 2000 })], NOW)
    const rec = buildRecommendation([], debts, safeHealthy)
    expect(rec?.kind).toBe("debt_due_soon")
    expect(rec?.action).toMatch(/late fee/i)
  })

  it("protects essentials when safe-to-use money is negative", () => {
    const debts = orderDebts([debt({ type: "credit_card" })], NOW)
    const rec = buildRecommendation([], debts, { monthlyAmount: -500, isNegative: true })
    expect(rec?.kind).toBe("protect_essentials")
  })

  it("balances a buffer with debt when there is no funded emergency fund", () => {
    const goals = orderGoals([goal({ currentSavings: 0 })], NOW)
    const debts = orderDebts([debt({ type: "credit_card", interestRate: 36 })], NOW)
    const rec = buildRecommendation(goals, debts, safeHealthy)
    expect(rec?.kind).toBe("balance_buffer_and_debt")
  })

  it("recommends extra payment on high-interest debt once the emergency fund is funded", () => {
    const goals = orderGoals([goal({ targetAmount: 5000, currentSavings: 5000 })], NOW)
    const debts = orderDebts([debt({ type: "credit_card", interestRate: 36 })], NOW)
    const rec = buildRecommendation(goals, debts, safeHealthy)
    expect(rec?.kind).toBe("extra_debt_payment")
    expect(rec?.debtId).toBe("d1")
  })

  it("funds the top-priority goal when there is no pressing debt", () => {
    const goals = orderGoals([goal({ deadline: new Date("2026-10-01T00:00:00Z") })], NOW)
    const rec = buildRecommendation(goals, [], safeHealthy)
    expect(rec?.kind).toBe("fund_goal")
    expect(rec?.goalId).toBe("g1")
  })

  it("returns null when there is nothing to act on", () => {
    expect(buildRecommendation([], [], safeHealthy)).toBeNull()
  })
})
