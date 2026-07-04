import type { Nudge } from "@prisma/client"

import { prisma } from "@/lib/db"
import { orderDebts, orderGoals } from "@/lib/coach"
import { computeSafeToUse, loadFinancialModel } from "@/lib/financial-model"
import { phraseNudge } from "@/lib/ai"
import { computeHabitProfile, selectTone } from "@/lib/habit"

import { selectNudge } from "./engine"

// Habit signals are learned from the last 60 days of Done/Skip/Remind-later
// responses (PRD 06 §4) — recent enough to reflect current behaviour.
const HABIT_WINDOW_MS = 60 * 24 * 60 * 60 * 1000

// Milestone 5 — server-side nudge persistence (PRD 05 §6 one nudge/day). Server
// only (Prisma + AI). The daily screen and the scheduled function both go through
// getOrCreateTodayNudge, so a nudge exists whether the cron ran or the user simply
// opened the app first.

// UTC midnight of the local calendar day — the stable key for the @db.Date column.
function dayKey(now: Date): Date {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

export async function getOrCreateTodayNudge(userId: string, now: Date = new Date()): Promise<Nudge | null> {
  const forDate = dayKey(now)

  const existing = await prisma.nudge.findUnique({ where: { userId_forDate: { userId, forDate } } })
  if (existing) return existing

  const model = await loadFinancialModel(userId)
  if (!model) return null // setup not done — nothing to nudge on yet

  const [goalRows, debtRows, profile, actionRows] = await Promise.all([
    prisma.goal.findMany({ where: { userId } }),
    prisma.debt.findMany({ where: { userId } }),
    prisma.profile.findUnique({ where: { userId } }),
    prisma.actionRecord.findMany({
      where: { userId, createdAt: { gte: new Date(now.getTime() - HABIT_WINDOW_MS) } },
      select: { category: true, actionKey: true, response: true, createdAt: true },
    }),
  ])

  // Milestone 6 — learn from history and feed the adaptation signals into the M5
  // engine's readiness factor + suppression + smaller-ask (PRD 06 §3–§5).
  const habits = computeHabitProfile(actionRows)

  const safe = computeSafeToUse(model, now)
  const picked = selectNudge({
    payday: model.income.payday,
    subscriptionsCount: model.subscriptions.length,
    goals: orderGoals(goalRows, now),
    debts: orderDebts(debtRows, now),
    safe,
    now,
    readinessHint: habits.readinessHints,
    suppressedTypes: habits.suppressedTypes,
    preferSmallerSaves: habits.preferSmallerSaves,
  })
  if (!picked) return null

  // Adaptive tone (§6) refines the onboarding tone, then AI phrases the nudge.
  // AI only makes it friendlier; on any failure we keep the template (§7 / §8).
  const tone = selectTone(habits, profile?.coachingTone)
  const phrased = await phraseNudge(picked, tone.tone)
  const action = phrased?.action ?? picked.action
  const reason = phrased?.reason ?? picked.reason

  try {
    return await prisma.nudge.create({
      data: {
        userId,
        forDate,
        type: picked.type,
        trigger: picked.trigger,
        action,
        reason,
        expectedBenefit: picked.expectedBenefit,
        actionKey: picked.actionKey,
        category: picked.category,
        goalId: picked.goalId,
        debtId: picked.debtId,
        aiPhrased: !!phrased,
      },
    })
  } catch {
    // Lost a race with a concurrent request (unique userId+forDate) — return theirs.
    return prisma.nudge.findUnique({ where: { userId_forDate: { userId, forDate } } })
  }
}

// Bulk generation for the Netlify scheduled function: every user who has finished
// financial setup (has an Income row) gets today's nudge pre-generated.
export async function generateDailyNudges(now: Date = new Date()): Promise<{ users: number; generated: number }> {
  const incomes = await prisma.income.findMany({ select: { userId: true } })
  let generated = 0
  for (const { userId } of incomes) {
    const nudge = await getOrCreateTodayNudge(userId, now)
    if (nudge) generated++
  }
  return { users: incomes.length, generated }
}
