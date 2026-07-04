import type { SafeToUseResult } from "@/lib/financial-model"

import type { BaseAnswer } from "./types"

// Milestone 7 — Purchase Decision Assistant (PRD 07 §4). Pure and deterministic:
// a verdict computed only from safe-to-use money (which already nets out goals,
// debt commitments, savings, and buffer). No AI, no invented data.

function formatINR(amount: number): string {
  return `₹${Math.max(0, Math.round(amount)).toLocaleString("en-IN")}`
}

function round100(value: number): number {
  return Math.max(100, Math.round(value / 100) * 100)
}

export function computeAffordability(amount: number, safe: SafeToUseResult): BaseAnswer {
  const monthly = safe.monthlyAmount
  // Comfortable = safe-to-use money with the yellow caution cushion left intact,
  // so a "safe to buy" purchase doesn't quietly tip the user toward the edge.
  const comfortable = Math.max(0, monthly - safe.riskZoneAmount)

  // No real safe money this month → protect essentials (§4 "avoid for now").
  if (safe.isNegative || monthly <= 0) {
    return {
      verdict: "avoid_for_now",
      answer: `Right now your safe-to-use money is tight, so spending ${formatINR(amount)} would come out of money meant for essentials, bills, or debt.`,
      nextAction: "Hold off on this one and revisit it after your next payday.",
    }
  }

  // Comfortably within budget → green.
  if (amount <= comfortable) {
    return {
      verdict: "safe_to_buy",
      answer: `Yes — ${formatINR(amount)} fits comfortably within your ${formatINR(monthly)} of safe-to-use money this month, so you'll stay in the green zone.`,
      nextAction: `Go ahead, and try to keep the rest of today's spending under ${formatINR(safe.dailySafeSpend)}.`,
    }
  }

  // Affordable this month but eats into the cushion → yes, with a tradeoff (§4 example).
  if (amount <= monthly) {
    const overage = amount - comfortable
    const weeklyOffset = round100(overage / 4)
    return {
      verdict: "safe_to_buy",
      answer: `You can, but ${formatINR(amount)} will push you toward the yellow zone this month. A safer limit today is ${formatINR(comfortable)}.`,
      nextAction: `If you go ahead, trim about ${formatINR(weeklyOffset)} a week from flexible spending for the next 4 weeks to stay on track.`,
    }
  }

  // More than this month's safe money, but within reach if split (§4 "buy in parts").
  if (amount <= monthly * 2) {
    const partNow = round100(comfortable)
    const rest = amount - partNow
    const weeks = Math.max(1, Math.ceil(rest / Math.max(1, safe.weeklySafeSpend)))
    return {
      verdict: "buy_in_parts",
      answer: `Not all at once — ${formatINR(amount)} is more than this month's ${formatINR(monthly)} of safe-to-use money, but you could split it.`,
      nextAction: `Pay about ${formatINR(partNow)} now and set aside the remaining ${formatINR(rest)} over the next ${weeks} week${weeks === 1 ? "" : "s"}.`,
    }
  }

  // Well beyond current means → save toward it first (§4 "buy later").
  const months = Math.max(1, Math.ceil(amount / monthly))
  return {
    verdict: "buy_later",
    answer: `This is a bigger purchase than your safe-to-use money supports right now, so buying today would eat into essentials or savings.`,
    nextAction: `Make it a short goal — saving about ${formatINR(monthly)} a month, you'd reach ${formatINR(amount)} in roughly ${months} months.`,
  }
}
