import type { Reflection } from "@prisma/client"

import { prisma } from "@/lib/db"
import { buildRecommendation, orderDebts, orderGoals } from "@/lib/coach"
import { computeSafeToUse, loadFinancialModel } from "@/lib/financial-model"
import { buildWeeklyInsight, computeHabitProfile, selectTone } from "@/lib/habit"
import { phraseReflectionSummary } from "@/lib/ai"

import { buildReflection } from "./generate"

// Milestone 8 — server-side weekly reflection persistence (PRD 08 §2, one per
// week). Server only. Both the /review screen and the weekly scheduled function
// go through getOrCreateThisWeekReflection, so a reflection exists whether the
// cron ran or the user opened the app first.

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000

// UTC midnight of this week's Monday — the stable one-per-week key.
function weekStartKey(now: Date): Date {
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const daysSinceMonday = (d.getUTCDay() + 6) % 7 // Sun=0 → 6, Mon=1 → 0, …
  d.setUTCDate(d.getUTCDate() - daysSinceMonday)
  return d
}

export async function getOrCreateThisWeekReflection(userId: string, now: Date = new Date()): Promise<Reflection | null> {
  const weekStart = weekStartKey(now)

  const existing = await prisma.reflection.findUnique({ where: { userId_weekStart: { userId, weekStart } } })
  if (existing) return existing

  const model = await loadFinancialModel(userId)
  if (!model) return null

  const [goalRows, debtRows, profileRow, actionRows] = await Promise.all([
    prisma.goal.findMany({ where: { userId } }),
    prisma.debt.findMany({ where: { userId } }),
    prisma.profile.findUnique({ where: { userId } }),
    prisma.actionRecord.findMany({
      where: { userId, createdAt: { gte: new Date(now.getTime() - WINDOW_MS) } },
      select: { category: true, actionKey: true, response: true, createdAt: true },
    }),
  ])

  const habits = computeHabitProfile(actionRows)
  const goals = orderGoals(goalRows, now)
  const debts = orderDebts(debtRows, now)
  const safe = computeSafeToUse(model, now)
  const recommendation = buildRecommendation(goals, debts, {
    monthlyAmount: safe.monthlyAmount,
    isNegative: safe.isNegative,
  })
  const content = buildReflection({ profile: habits, goals, recommendation, insight: buildWeeklyInsight(habits), model })

  // AI only makes the summary warmer; failure keeps the deterministic text (§7).
  const tone = selectTone(habits, profileRow?.coachingTone).tone
  const phrased = await phraseReflectionSummary(content.summary, content.pattern, tone)

  try {
    return await prisma.reflection.create({
      data: {
        userId,
        weekStart,
        completed: content.completed,
        total: content.total,
        summary: phrased ?? content.summary,
        pattern: content.pattern,
        nextAction: content.nextAction,
        nextActionCategory: content.nextActionCategory,
        nextActionKey: content.nextActionKey,
        goalProgress: content.goalProgress,
        habitInsight: content.habitInsight,
        challengeTitle: content.challengeTitle,
        challengeDetail: content.challengeDetail,
        aiPhrased: !!phrased,
      },
    })
  } catch {
    // Lost a race with a concurrent request (unique userId+weekStart) — return theirs.
    return prisma.reflection.findUnique({ where: { userId_weekStart: { userId, weekStart } } })
  }
}

// Bulk generation for the Netlify weekly scheduled function.
export async function generateWeeklyReflections(now: Date = new Date()): Promise<{ users: number; generated: number }> {
  const incomes = await prisma.income.findMany({ select: { userId: true } })
  let generated = 0
  for (const { userId } of incomes) {
    const r = await getOrCreateThisWeekReflection(userId, now)
    if (r) generated++
  }
  return { users: incomes.length, generated }
}
