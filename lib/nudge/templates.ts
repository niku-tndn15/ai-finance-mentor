import { DEBT_TYPE_LABEL } from "@/lib/coach"

import type { NudgeCandidate, NudgeContext } from "./types"

// Milestone 5 — the non-AI fallback nudge templates (PRD 05 §3), one builder per
// nudge type. Each returns a fully-formed candidate (the §5 anatomy: trigger,
// action, reason, expected benefit) or null when its trigger condition isn't met.
// These are the deterministic ground truth the AI phrasing layer rewrites on top
// of — and what the app falls back to when AI is unavailable (§7 / §8).

function formatINR(amount: number): string {
  return `₹${Math.max(0, Math.round(amount)).toLocaleString("en-IN")}`
}

// Round to the nearest ₹100 and clamp — keeps suggested amounts legible and the
// ask small enough to actually complete (PRD 05 §2 readiness).
function clampRound100(value: number, min: number, max: number): number {
  const rounded = Math.round(value / 100) * 100
  return Math.min(max, Math.max(min, rounded))
}

function debtLabel(type: keyof typeof DEBT_TYPE_LABEL): string {
  return DEBT_TYPE_LABEL[type].toLowerCase()
}

// Suggested save amount for payday/goal nudges. When the habit model asks for a
// smaller ask (PRD 06 §5 — user skips bigger saves, completes small ones), we
// take a smaller slice and cap it low so the action is easy to complete.
function saveAmount(ctx: NudgeContext): number {
  const fraction = ctx.preferSmallerSaves ? 0.1 : 0.25
  const cap = ctx.preferSmallerSaves ? 1000 : 5000
  return clampRound100(ctx.safe.weeklySafeSpend * fraction, 100, cap)
}

// Most recent payday was 0 or 1 days ago → "salary just came in, spending hasn't
// started" (PRD 05 §3 payday nudge). Month-boundary edge cases are acceptable for
// a daily nudge.
function justPaid(payday: number, now: Date): boolean {
  const day = now.getDate()
  return day === payday || day === payday + 1
}

// --- Builders (return null when the trigger doesn't apply) ---

export function buildDebtNudge(ctx: NudgeContext): NudgeCandidate | null {
  const top = ctx.debts[0]
  if (!top) return null

  const dueSoon = top.daysUntilDue != null && (top.daysUntilDue <= 7 || top.lateFeeRisk === "high")
  const label = debtLabel(top.type)

  if (dueSoon) {
    const overdue = top.daysUntilDue != null && top.daysUntilDue < 0
    const when =
      top.daysUntilDue == null
        ? "soon"
        : top.daysUntilDue < 0
          ? "overdue"
          : top.daysUntilDue === 0
            ? "due today"
            : `due in ${top.daysUntilDue} day${top.daysUntilDue === 1 ? "" : "s"}`
    const min = top.minimumPayment ? ` of at least ${formatINR(top.minimumPayment)}` : ""
    return {
      type: "debt",
      urgencyRank: 1,
      trigger: `Your ${label} payment is ${when}.`,
      action: `Make a payment${min} on your ${label} ${overdue ? "now" : "before it's due"} to avoid a late fee.`,
      reason: "Paying before the due date avoids a late fee and extra interest.",
      expectedBenefit: "You skip late fees — usually the cheapest win available.",
      actionKey: `debt-due:${top.id}`,
      category: "debt",
      debtId: top.id,
      readiness: 0.7,
      impact: 1,
    }
  }

  const highInterest =
    top.urgency === "highest" && (top.type === "credit_card" || top.type === "bnpl" || (top.interestRate ?? 0) >= 24)
  if (highInterest && ctx.safe.monthlyAmount > 0) {
    const extra = clampRound100(ctx.safe.monthlyAmount * 0.3, 100, 100000)
    return {
      type: "debt",
      urgencyRank: 4,
      trigger: `Your ${label} carries the highest interest of your debts.`,
      action: `Put about ${formatINR(extra)} extra toward your ${label} this month.`,
      reason: "It costs the most in interest, so paying it down early saves the most.",
      expectedBenefit: "Less interest paid over the life of the debt.",
      actionKey: `debt-payoff:${top.id}`,
      category: "debt",
      debtId: top.id,
      readiness: 0.5,
      impact: 0.85,
    }
  }

  return null
}

export function buildLowMoneyNudge(ctx: NudgeContext): NudgeCandidate | null {
  if (!ctx.safe.isNegative && ctx.safe.zone !== "red") return null
  return {
    type: "low_money",
    urgencyRank: 2,
    trigger: "Your safe-to-use money is tight this month.",
    action: ctx.safe.lowMoneyGuidance?.action ?? "Cover essentials and minimum payments only this week.",
    reason:
      ctx.safe.lowMoneyGuidance?.message ?? "Protecting essentials matters more than getting ahead right now.",
    expectedBenefit: "You avoid new debt and keep essentials covered.",
    actionKey: "protect-essentials",
    category: "save_vs_debt",
    readiness: 0.8,
    impact: 0.9,
  }
}

export function buildPaydayNudge(ctx: NudgeContext): NudgeCandidate | null {
  if (!justPaid(ctx.payday, ctx.now) || ctx.safe.monthlyAmount <= 0) return null

  const topGoal = ctx.goals.find((g) => g.remaining > 0)
  const amount = saveAmount(ctx)
  const target = topGoal?.name ?? "savings"
  return {
    type: "payday",
    urgencyRank: 3,
    trigger: "Your salary just came in and spending hasn't started yet.",
    action: `Move ${formatINR(amount)} to your ${target} before spending starts.`,
    reason: "Saving right after payday protects it before everyday spending eats into it.",
    expectedBenefit: "You get ahead with money you won't miss later.",
    actionKey: topGoal ? `goal-contribution:${topGoal.id}` : "payday-save",
    category: topGoal ? "goal" : "save_vs_debt",
    goalId: topGoal?.id,
    readiness: 0.9,
    impact: 0.8,
  }
}

export function buildGoalNudge(ctx: NudgeContext): NudgeCandidate | null {
  const topGoal = ctx.goals.find((g) => g.remaining > 0)
  if (!topGoal || ctx.safe.monthlyAmount <= 0) return null

  const amount = saveAmount(ctx)
  return {
    type: "goal",
    urgencyRank: 5,
    trigger: `You're ${topGoal.progressPercent}% of the way to your ${topGoal.name}.`,
    action: `Add ${formatINR(amount)} to your ${topGoal.name} today to stay ahead.`,
    reason: "Small, steady adds keep the goal on track without a big hit.",
    expectedBenefit: "Steady progress toward something that matters to you.",
    actionKey: `goal-contribution:${topGoal.id}`,
    category: "goal",
    goalId: topGoal.id,
    readiness: 0.85,
    impact: 0.6,
  }
}

export function buildWeekendNudge(ctx: NudgeContext): NudgeCandidate | null {
  const day = ctx.now.getDay() // 0 Sun … 6 Sat
  const isWeekendEve = day === 5 || day === 6
  const limit = ctx.safe.weekendSafeSpend
  if (!isWeekendEve || limit <= 0) return null

  return {
    type: "weekend",
    urgencyRank: 6,
    trigger: "Weekends are when spending usually creeps up.",
    action: `Keep ${formatINR(limit)} as your weekend spending limit.`,
    reason: "A simple limit keeps a fun weekend from denting your goals.",
    expectedBenefit: "You enjoy the weekend and still protect your plan.",
    actionKey: "weekend-limit",
    category: "general",
    readiness: 0.6,
    impact: 0.55,
  }
}

export function buildSubscriptionNudge(ctx: NudgeContext): NudgeCandidate | null {
  if (ctx.subscriptionsCount < 2) return null
  return {
    type: "subscription",
    urgencyRank: 7,
    trigger: `You have ${ctx.subscriptionsCount} recurring payments.`,
    action: "Cancel one subscription you no longer use.",
    reason: "Recurring charges are easy to forget and add up every month.",
    expectedBenefit: "Every cancelled subscription saves money every month.",
    actionKey: "subscription-cleanup",
    category: "subscription",
    readiness: 0.5,
    impact: 0.75,
  }
}

export function buildImpulseNudge(ctx: NudgeContext): NudgeCandidate | null {
  // A weekly habit challenge (PRD 05 §4 rank 8), surfaced at the start of the
  // week (Monday) so it doesn't permanently outrank the general safe-spend
  // fallback (rank 9) that should carry ordinary days.
  if (ctx.now.getDay() !== 1) return null
  return {
    type: "impulse",
    urgencyRank: 8,
    trigger: "A small habit worth building this week.",
    action: "Before your next non-essential buy, wait 24 hours.",
    reason: "A short pause turns most impulse buys into skipped ones.",
    expectedBenefit: "Fewer regretted purchases, more money kept.",
    actionKey: "impulse-24h",
    category: "impulse",
    readiness: 0.8,
    impact: 0.4,
  }
}

export function buildSafeSpendNudge(ctx: NudgeContext): NudgeCandidate | null {
  if (ctx.safe.dailySafeSpend <= 0) return null
  return {
    type: "safe_spend",
    urgencyRank: 9,
    trigger: "Here's your safe amount for today.",
    action: `You can safely spend ${formatINR(ctx.safe.dailySafeSpend)} today. Try to stay under it.`,
    reason: "Staying under your safe daily amount keeps bills, savings, and goals on track.",
    expectedBenefit: "You end the month on plan.",
    actionKey: "safe-spend-day",
    category: "general",
    readiness: 0.85,
    impact: 0.35,
  }
}

export const ALL_BUILDERS = [
  buildDebtNudge,
  buildLowMoneyNudge,
  buildPaydayNudge,
  buildGoalNudge,
  buildWeekendNudge,
  buildSubscriptionNudge,
  buildImpulseNudge,
  buildSafeSpendNudge,
]
