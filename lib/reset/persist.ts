import type { MonthlyReset } from "@prisma/client"

import { prisma } from "@/lib/db"
import { buildRecommendation, orderDebts, orderGoals } from "@/lib/coach"
import { computeSafeToUse, loadFinancialModel } from "@/lib/financial-model"
import { computeHabitProfile, selectTone } from "@/lib/habit"
import { phraseResetSummary } from "@/lib/ai"

import { buildMonthlyReset } from "./generate"

// Milestone 8 — server-side monthly reset persistence (PRD 08 §3, one per month).
// Server only. Both the /review screen and the monthly scheduled function go
// through getOrCreateThisMonthReset, so a reset exists whether the cron ran or
// the user opened the app first. Mirrors the weekly-reflection pattern.

// Trailing window the reset reflects on. ~1 month of action history; kept simple
// (no calendar-month boundary maths) since the MVP reset is lightweight.
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000

// UTC midnight of the 1st of this month — the stable one-per-month key.
function monthStartKey(now: Date): Date {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
}

export async function getOrCreateThisMonthReset(userId: string, now: Date = new Date()): Promise<MonthlyReset | null> {
  const monthStart = monthStartKey(now)

  const existing = await prisma.monthlyReset.findUnique({ where: { userId_monthStart: { userId, monthStart } } })
  if (existing) return existing

  const model = await loadFinancialModel(userId)
  if (!model) return null

  const [goalRows, debtRows, profileRow, actionRows, flexExpenseRows, subscriptionRows] = await Promise.all([
    prisma.goal.findMany({ where: { userId } }),
    prisma.debt.findMany({ where: { userId } }),
    prisma.profile.findUnique({ where: { userId } }),
    prisma.actionRecord.findMany({
      where: { userId, createdAt: { gte: new Date(now.getTime() - WINDOW_MS) } },
      select: { category: true, actionKey: true, response: true, createdAt: true },
    }),
    // Named movable costs — the model input strips category/name, so query them
    // directly to point the reset at a specific expense (§3).
    prisma.fixedExpense.findMany({ where: { userId, negotiability: "semi_negotiable" }, select: { category: true, amount: true } }),
    prisma.subscription.findMany({ where: { userId }, select: { name: true, amount: true } }),
  ])

  const flexibleCosts = [
    ...flexExpenseRows.map((e) => ({ name: e.category, amount: e.amount })),
    ...subscriptionRows.map((s) => ({ name: s.name, amount: s.amount })),
  ]

  const habits = computeHabitProfile(actionRows)
  const goals = orderGoals(goalRows, now)
  const debts = orderDebts(debtRows, now)
  const safe = computeSafeToUse(model, now)
  const recommendation = buildRecommendation(goals, debts, {
    monthlyAmount: safe.monthlyAmount,
    isNegative: safe.isNegative,
  })
  const content = buildMonthlyReset({ profile: habits, goals, recommendation, model, flexibleCosts, safe })

  // AI only makes the headline warmer; failure keeps the deterministic text (§7).
  const tone = selectTone(habits, profileRow?.coachingTone).tone
  const phrased = await phraseResetSummary(content.summary, content.changeNextMonth, tone)

  try {
    return await prisma.monthlyReset.create({
      data: {
        userId,
        monthStart,
        summary: phrased ?? content.summary,
        overspend: content.overspend,
        savings: content.savings,
        biggestLeak: content.biggestLeak,
        goalMovement: content.goalMovement,
        changeNextMonth: content.changeNextMonth,
        safeToUseNextMonth: content.safeToUseNextMonth,
        safeToUseSummary: content.safeToUseSummary,
        nextAction: content.nextAction,
        nextActionCategory: content.nextActionCategory,
        nextActionKey: content.nextActionKey,
        aiPhrased: !!phrased,
      },
    })
  } catch {
    // Lost a race with a concurrent request (unique userId+monthStart) — return theirs.
    return prisma.monthlyReset.findUnique({ where: { userId_monthStart: { userId, monthStart } } })
  }
}

// Bulk generation for the Netlify monthly scheduled function.
export async function generateMonthlyResets(now: Date = new Date()): Promise<{ users: number; generated: number }> {
  const incomes = await prisma.income.findMany({ select: { userId: true } })
  let generated = 0
  for (const { userId } of incomes) {
    const r = await getOrCreateThisMonthReset(userId, now)
    if (r) generated++
  }
  return { users: incomes.length, generated }
}
