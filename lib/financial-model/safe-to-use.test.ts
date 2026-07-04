import { describe, expect, it } from "vitest"

import { computeSafeToUse, daysUntilNextPayday, LOW_CONFIDENCE_DISCLAIMER } from "./safe-to-use"
import type { FinancialModelInput } from "./types"

// A payday well after "now" so the day-count is stable and > 1.
const NOW = new Date("2026-07-02T00:00:00Z")

function input(overrides: Partial<FinancialModelInput> = {}): FinancialModelInput {
  return {
    income: { monthlyAmount: 60000, stability: "high", plannedSavings: 7000, payday: 25 },
    fixedExpenses: [{ amount: 31000, negotiability: "non_negotiable" }],
    subscriptions: [],
    goals: [{ targetAmount: 60000, currentSavings: 10000 }],
    debts: [{ outstanding: 20000, minimumPayment: 5000 }],
    ...overrides,
  } as FinancialModelInput
}

describe("daysUntilNextPayday", () => {
  it("counts to this month's payday when it's still ahead", () => {
    expect(daysUntilNextPayday(25, new Date(2026, 6, 2))).toBe(23) // Jul 2 → Jul 25
  })

  it("rolls to next month once the payday has passed (or is today)", () => {
    expect(daysUntilNextPayday(25, new Date(2026, 6, 25))).toBe(31) // Jul 25 → Aug 25
    expect(daysUntilNextPayday(1, new Date(2026, 6, 15))).toBe(17) // Jul 15 → Aug 1
  })

  it("clamps a 31st payday to a short month's last day", () => {
    // Feb 2026 has 28 days; payday 31 → Feb 28.
    expect(daysUntilNextPayday(31, new Date(2026, 1, 10))).toBe(18)
  })
})

describe("core calculation (PRD 03 §2)", () => {
  it("matches the PRD example: 60000 − 31000 − 7000 − 5000 buffer → 17000", () => {
    // High stability → no emergency buffer; goal has no deadline → 0 monthly.
    const out = computeSafeToUse(input(), NOW)
    expect(out.monthlyAmount).toBe(17000)
    expect(out.breakdown.committed).toBe(43000)
    expect(out.doNotTouch).toBe(43000)
    expect(out.isNegative).toBe(false)
  })

  it("includes subscriptions in the fixed total", () => {
    const out = computeSafeToUse(
      input({ subscriptions: [{ amount: 1000 }], debts: [] }),
      NOW
    )
    // 60000 − (31000+1000) − 7000 − 0 = 21000
    expect(out.breakdown.fixedExpenses).toBe(32000)
    expect(out.monthlyAmount).toBe(21000)
  })

  it("adds an emergency buffer for low-predictability income", () => {
    const out = computeSafeToUse(
      input({
        income: { monthlyAmount: 60000, stability: "low", plannedSavings: 7000, payday: 25 },
        debts: [],
      }),
      NOW
    )
    // buffer = 10% of 60000 = 6000; 60000 − 31000 − 7000 − 6000 = 16000
    expect(out.breakdown.emergencyBuffer).toBe(6000)
    expect(out.monthlyAmount).toBe(16000)
  })
})

describe("daily / weekly / weekend spend (§3)", () => {
  it("spreads safe-to-use across days until payday", () => {
    const out = computeSafeToUse(input(), NOW) // 17000 over 23 days
    expect(out.dailySafeSpend).toBe(Math.floor(17000 / 23))
    expect(out.weeklySafeSpend).toBe(out.dailySafeSpend * 7)
    expect(out.weekendSafeSpend).toBe(out.dailySafeSpend * 2)
  })

  it("zeroes out daily/weekly spend when safe-to-use is negative", () => {
    const out = computeSafeToUse(
      input({ fixedExpenses: [{ amount: 70000, negotiability: "non_negotiable" }] }),
      NOW
    )
    expect(out.isNegative).toBe(true)
    expect(out.dailySafeSpend).toBe(0)
    expect(out.weeklySafeSpend).toBe(0)
  })
})

describe("risk zones (§4/§5)", () => {
  it("is green with healthy headroom", () => {
    expect(computeSafeToUse(input(), NOW).zone).toBe("green")
  })

  it("is yellow when the safe amount is thinner than the caution cushion", () => {
    // riskZone = 10% of 60000 = 6000. Fixed 31000 + savings 24000 → safe 5000 ≤ 6000.
    const out = computeSafeToUse(
      input({ income: { monthlyAmount: 60000, stability: "high", plannedSavings: 24000, payday: 25 }, debts: [] }),
      NOW
    )
    expect(out.monthlyAmount).toBeLessThanOrEqual(out.riskZoneAmount)
    expect(out.zone).toBe("yellow")
  })

  it("is red and gives calm essentials-first guidance when negative", () => {
    const out = computeSafeToUse(
      input({ fixedExpenses: [{ amount: 70000, negotiability: "non_negotiable" }] }),
      NOW
    )
    expect(out.zone).toBe("red")
    expect(out.lowMoneyGuidance).toBeDefined()
    expect(out.lowMoneyGuidance?.message.toLowerCase()).toContain("essentials first")
    expect(out.lowMoneyGuidance?.action).toBeTruthy()
  })

  it("suggests trimming the largest flexible cost first", () => {
    const out = computeSafeToUse(
      input({
        fixedExpenses: [
          { amount: 70000, negotiability: "non_negotiable" },
          { amount: 4000, negotiability: "semi_negotiable" },
        ],
        subscriptions: [{ amount: 1500 }],
      }),
      NOW
    )
    // Largest flexible is the 4000 semi-negotiable expense.
    expect(out.lowMoneyGuidance?.action).toContain("₹4,000")
  })
})

describe("confidence (§7)", () => {
  it("is high when income, fixed, goals and debts are all present", () => {
    expect(computeSafeToUse(input(), NOW).confidence).toBe("high")
    expect(computeSafeToUse(input(), NOW).disclaimer).toBeUndefined()
  })

  it("is medium when debts are missing", () => {
    expect(computeSafeToUse(input({ debts: [] }), NOW).confidence).toBe("medium")
  })

  it("is low with the exact disclaimer when major costs are missing", () => {
    const out = computeSafeToUse(input({ fixedExpenses: [], subscriptions: [], debts: [] }), NOW)
    expect(out.confidence).toBe("low")
    expect(out.disclaimer).toBe(LOW_CONFIDENCE_DISCLAIMER)
  })
})
