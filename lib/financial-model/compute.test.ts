import { describe, expect, it } from "vitest"

import { computeFinancialModel } from "./compute"
import type { FinancialModelInput } from "./types"

// A fixed "now" so due-date maths is deterministic.
const NOW = new Date("2026-07-02T00:00:00Z")

function baseInput(overrides: Partial<FinancialModelInput> = {}): FinancialModelInput {
  return {
    income: { monthlyAmount: 60000, payday: 25, stability: "high", plannedSavings: 7000 },
    fixedExpenses: [],
    subscriptions: [],
    goals: [{ targetAmount: 60000, currentSavings: 10000 }],
    debts: [],
    ...overrides,
  }
}

describe("income predictability", () => {
  it("mirrors the stability level by default", () => {
    expect(computeFinancialModel(baseInput({ income: { monthlyAmount: 50000, payday: 1, stability: "low", plannedSavings: 0 } }), NOW).incomePredictability).toBe("low")
    expect(computeFinancialModel(baseInput({ income: { monthlyAmount: 50000, payday: 1, stability: "medium", plannedSavings: 0 } }), NOW).incomePredictability).toBe("medium")
  })

  it("downgrades a high-stability income when irregular income is a big share", () => {
    const out = computeFinancialModel(
      baseInput({ income: { monthlyAmount: 100000, payday: 1, stability: "high", plannedSavings: 0, irregularIncome: 40000 } }),
      NOW
    )
    expect(out.incomePredictability).toBe("medium")
  })
})

describe("fixed commitment load", () => {
  it("sums fixed expenses and subscriptions against income and bands it", () => {
    const out = computeFinancialModel(
      baseInput({
        income: { monthlyAmount: 60000, payday: 1, stability: "high", plannedSavings: 0 },
        fixedExpenses: [
          { amount: 18000, negotiability: "non_negotiable" },
          { amount: 8000, negotiability: "non_negotiable" },
        ],
        subscriptions: [{ amount: 1000 }],
      }),
      NOW
    )
    expect(out.fixedCommitmentLoad.monthlyAmount).toBe(27000)
    expect(out.fixedCommitmentLoad.ratio).toBeCloseTo(0.45, 2)
    expect(out.fixedCommitmentLoad.band).toBe("moderate")
  })

  it("reports 'none' when there are no fixed costs", () => {
    expect(computeFinancialModel(baseInput(), NOW).fixedCommitmentLoad.band).toBe("none")
  })

  it("flags a very high load above 70% of income", () => {
    const out = computeFinancialModel(
      baseInput({
        income: { monthlyAmount: 30000, payday: 1, stability: "high", plannedSavings: 0 },
        fixedExpenses: [{ amount: 25000, negotiability: "non_negotiable" }],
      }),
      NOW
    )
    expect(out.fixedCommitmentLoad.band).toBe("very_high")
  })
})

describe("goal commitment load", () => {
  it("derives monthly need from the gap to target over months to deadline", () => {
    // 50,000 remaining over ~6 months ≈ 8,333/mo on 60,000 income.
    const out = computeFinancialModel(
      baseInput({
        goals: [{ targetAmount: 60000, currentSavings: 10000, deadline: new Date("2027-01-02T00:00:00Z") }],
      }),
      NOW
    )
    expect(out.goalCommitmentLoad.monthlyAmount).toBeGreaterThan(7000)
    expect(out.goalCommitmentLoad.monthlyAmount).toBeLessThan(9500)
  })

  it("prefers an explicit monthly contribution when present", () => {
    const out = computeFinancialModel(
      baseInput({ goals: [{ targetAmount: 100000, currentSavings: 0, monthlyContribution: 5000 }] }),
      NOW
    )
    expect(out.goalCommitmentLoad.monthlyAmount).toBe(5000)
  })

  it("contributes zero when a goal has no deadline and no explicit contribution", () => {
    const out = computeFinancialModel(baseInput({ goals: [{ targetAmount: 60000, currentSavings: 0 }] }), NOW)
    expect(out.goalCommitmentLoad.monthlyAmount).toBe(0)
    expect(out.goalCommitmentLoad.band).toBe("none")
  })
})

describe("debt urgency", () => {
  it("is 'none' with no debts", () => {
    expect(computeFinancialModel(baseInput(), NOW).debtUrgency.overall).toBe("none")
  })

  it("classifies a high-interest card as high urgency", () => {
    const out = computeFinancialModel(
      baseInput({ debts: [{ outstanding: 24000, interestRate: 36 }] }),
      NOW
    )
    expect(out.debtUrgency.overall).toBe("high")
    expect(out.debtUrgency.perDebt[0].urgency).toBe("high")
    expect(out.debtUrgency.perDebt[0].reasons.join(" ")).toContain("high interest")
  })

  it("flags an imminent due date and overdue payments", () => {
    const dueSoon = computeFinancialModel(
      baseInput({ debts: [{ outstanding: 5000, dueDate: new Date("2026-07-05T00:00:00Z") }] }),
      NOW
    )
    expect(dueSoon.debtUrgency.overall).toBe("high")

    const overdue = computeFinancialModel(
      baseInput({ debts: [{ outstanding: 5000, dueDate: new Date("2026-06-28T00:00:00Z") }] }),
      NOW
    )
    expect(overdue.debtUrgency.perDebt[0].reasons).toContain("payment overdue")
  })

  it("rolls up to the worst debt and totals outstanding + minimums", () => {
    const out = computeFinancialModel(
      baseInput({
        debts: [
          { outstanding: 10000, interestRate: 14, minimumPayment: 1000 },
          { outstanding: 24000, interestRate: 36, minimumPayment: 2000 },
        ],
      }),
      NOW
    )
    expect(out.debtUrgency.overall).toBe("high")
    expect(out.debtUrgency.totalOutstanding).toBe(34000)
    expect(out.debtUrgency.totalMinimumPayments).toBe(3000)
  })

  it("treats a moderate-interest, distant-due loan as medium urgency", () => {
    const out = computeFinancialModel(
      baseInput({ debts: [{ outstanding: 50000, interestRate: 14 }] }),
      NOW
    )
    expect(out.debtUrgency.overall).toBe("medium")
  })
})
