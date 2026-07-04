import { computeAffordability } from "./affordability"
import type { BaseAnswer, MentorContext, MentorIntent } from "./types"

// Milestone 7 — deterministic base answers for the MVP question set (PRD 07 §2),
// grounded in the user's real model. These are what the app returns when AI is
// off or fails (§7 / §8); the AI layer only rephrases them. Pure.

function formatINR(amount: number): string {
  return `₹${Math.max(0, Math.round(amount)).toLocaleString("en-IN")}`
}

function round100(value: number): number {
  return Math.max(100, Math.round(value / 100) * 100)
}

function sum(ns: number[]): number {
  return ns.reduce((t, n) => t + n, 0)
}

export function buildBaseAnswer(
  intent: MentorIntent,
  amount: number | null,
  ctx: MentorContext
): BaseAnswer {
  switch (intent) {
    case "affordability":
      return affordability(amount, ctx)
    case "save_this_week":
      return saveThisWeek(ctx)
    case "fix_first":
      return fixFirst(ctx)
    case "why_not_saving":
      return whyNotSaving(ctx)
    case "save_vs_debt":
      return saveVsDebt(ctx)
    case "reduce_spending":
      return reduceSpending(ctx)
    default:
      return unknown()
  }
}

function affordability(amount: number | null, ctx: MentorContext): BaseAnswer {
  // §7: missing the one input needed → ask for it, don't guess.
  if (amount === null) {
    return {
      answer: "Happy to check — how much are you thinking of spending?",
      assumptions: "I need the amount to compare it against your safe-to-use money.",
      nextAction: "Reply with an amount, like “Can I spend ₹2,000 today?”",
    }
  }
  return computeAffordability(amount, ctx.safe)
}

function saveThisWeek(ctx: MentorContext): BaseAnswer {
  if (ctx.safe.isNegative || ctx.safe.monthlyAmount <= 0) {
    return {
      answer: "This month is tight, so the priority is covering essentials before adding to savings.",
      nextAction: "Free up room first by reviewing one flexible expense this week.",
    }
  }
  const topGoal = ctx.goals.find((g) => g.remaining > 0)
  const fromGoal = topGoal?.requiredMonthlyContribution ? Math.ceil(topGoal.requiredMonthlyContribution / 4) : 0
  const target = round100(fromGoal > 0 ? fromGoal : ctx.safe.weeklySafeSpend * 0.3)
  const name = topGoal?.name ?? "savings"
  return {
    answer: `Based on your safe-to-use money, aim to set aside about ${formatINR(target)} this week toward your ${name}.`,
    nextAction: `Move ${formatINR(target)} into your ${name} now, before the week's spending starts.`,
  }
}

function fixFirst(ctx: MentorContext): BaseAnswer {
  if (ctx.recommendation) {
    return {
      answer: `The highest-impact move right now: ${ctx.recommendation.action} ${ctx.recommendation.reason}`,
      nextAction: ctx.recommendation.action,
    }
  }
  return {
    answer: "You have no urgent debt or shortfall, so the best thing to protect is your day-to-day spending.",
    nextAction: `Keep today's spending under ${formatINR(ctx.safe.dailySafeSpend)}.`,
  }
}

function whyNotSaving(ctx: MentorContext): BaseAnswer {
  const income = Math.max(1, ctx.model.income.monthlyAmount)
  const fixedMonthly = sum(ctx.model.fixedExpenses.map((e) => e.amount)) + sum(ctx.model.subscriptions.map((s) => s.amount))
  const fixedPct = Math.round((fixedMonthly / income) * 100)

  if (ctx.safe.isNegative) {
    return {
      answer: "Your must-pay costs currently run higher than your income plan, so there's little left to save after essentials.",
      nextAction: "Review one flexible expense this week to open up some breathing room.",
    }
  }
  if (ctx.model.income.plannedSavings === 0) {
    return {
      answer: "Saving isn't built into your month yet — you haven't set a planned savings amount, so it depends on whatever's left over.",
      nextAction: "Set a small planned savings amount, even ₹500, so it happens automatically.",
    }
  }
  if (fixedPct >= 60) {
    return {
      answer: `About ${fixedPct}% of your income goes to fixed costs, which leaves less room to save each month.`,
      nextAction: "Look for one flexible expense or subscription to trim.",
    }
  }
  return {
    answer: "Your plan can support saving — the gap is usually everyday spending quietly adding up.",
    nextAction: `Keep daily spending under ${formatINR(ctx.safe.dailySafeSpend)} and move the difference to savings.`,
  }
}

function saveVsDebt(ctx: MentorContext): BaseAnswer {
  if (ctx.recommendation) {
    return { answer: ctx.recommendation.reason, nextAction: ctx.recommendation.action }
  }
  if (ctx.debts.length === 0) {
    const topGoal = ctx.goals.find((g) => g.remaining > 0)
    return {
      answer: "You don't have any debt recorded, so saving comes first — put your safe money toward your top goal.",
      nextAction: topGoal ? `Add to your ${topGoal.name} this week.` : "Set a goal so I can guide your saving.",
    }
  }
  return {
    answer: "With money tight, cover essentials and the minimum on each debt before adding extra to either.",
    nextAction: "Pay each debt's minimum, then revisit once your safe-to-use money recovers.",
  }
}

function reduceSpending(ctx: MentorContext): BaseAnswer {
  const subs = ctx.model.subscriptions.length
  const hasFlexible = ctx.model.fixedExpenses.some((e) => e.negotiability === "semi_negotiable")

  if (subs >= 1) {
    return {
      answer: `The easiest cut that won't feel restrictive is a subscription you rarely use — you have ${subs} recurring payment${subs === 1 ? "" : "s"}.`,
      nextAction: "Cancel or pause one subscription you don't really use.",
    }
  }
  if (hasFlexible) {
    return {
      answer: "Trimming one flexible expense frees up money without touching the small things you enjoy every day.",
      nextAction: "Pick one flexible expense to lower this month.",
    }
  }
  return {
    answer: "Rather than cutting out what you enjoy, cap one area with a gentle limit and save the difference.",
    nextAction: `Set a ${formatINR(ctx.safe.dailySafeSpend)} daily spending limit for this week.`,
  }
}

function unknown(): BaseAnswer {
  return {
    answer:
      "I can help with your safe-to-use money, how much to save this week, what to fix first, whether to pay debt or save, or whether you can afford a purchase.",
    nextAction: "Try asking: “Can I spend ₹2,000 today?”",
  }
}
