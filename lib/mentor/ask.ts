import { prisma } from "@/lib/db"
import { buildRecommendation, orderDebts, orderGoals } from "@/lib/coach"
import { computeSafeToUse, loadFinancialModel } from "@/lib/financial-model"
import { computeHabitProfile, buildWeeklyInsight, selectTone } from "@/lib/habit"
import { answerMentorQuestion } from "@/lib/ai"

import { detectIntent } from "./intent"
import { buildBaseAnswer } from "./fallback"
import { buildGrounding } from "./grounding"
import type { MentorAnswer, MentorContext } from "./types"

// Milestone 7 — the mentor orchestrator (server). Loads the user's real model,
// computes the deterministic base answer, then lets AI rephrase it grounded in
// the same data. AI failure or absence falls straight back to the base answer, so
// there is always a real, safe reply (PRD 07 §7/§8, PRD 09 §7).

const HABIT_WINDOW_MS = 60 * 24 * 60 * 60 * 1000

export async function answerMentor(userId: string, question: string): Promise<MentorAnswer> {
  const model = await loadFinancialModel(userId)
  if (!model) {
    return {
      answer: "Let's set up your money picture first so I can answer with your real numbers instead of guessing.",
      nextAction: "Complete your quick financial setup.",
      intent: "unknown",
      usedAI: false,
      lowConfidence: true,
    }
  }

  const now = new Date()
  const safe = computeSafeToUse(model, now)

  const [goalRows, debtRows, profile, actionRows] = await Promise.all([
    prisma.goal.findMany({ where: { userId } }),
    prisma.debt.findMany({ where: { userId } }),
    prisma.profile.findUnique({ where: { userId } }),
    prisma.actionRecord.findMany({
      where: { userId, createdAt: { gte: new Date(now.getTime() - HABIT_WINDOW_MS) } },
      select: { category: true, actionKey: true, response: true, createdAt: true },
    }),
  ])

  const goals = orderGoals(goalRows, now)
  const debts = orderDebts(debtRows, now)
  const recommendation = buildRecommendation(goals, debts, {
    monthlyAmount: safe.monthlyAmount,
    isNegative: safe.isNegative,
  })
  const habits = computeHabitProfile(actionRows)
  const insight = buildWeeklyInsight(habits)

  const ctx: MentorContext = { safe, model, goals, debts, recommendation, insight }
  const { intent, amount } = detectIntent(question)
  const base = buildBaseAnswer(intent, amount, ctx)

  // AI rephrases the deterministic draft, grounded in the same snapshot and tone.
  const tone = selectTone(habits, profile?.coachingTone).tone
  const ai = await answerMentorQuestion({
    question,
    grounding: buildGrounding(ctx),
    draftAnswer: base.assumptions ? `${base.answer} (${base.assumptions})` : base.answer,
    draftNextAction: base.nextAction,
    tone,
  })

  return {
    answer: ai?.answer ?? base.answer,
    nextAction: ai?.nextAction ?? base.nextAction,
    verdict: base.verdict,
    assumptions: base.assumptions,
    intent,
    usedAI: !!ai,
    lowConfidence: safe.confidence !== "high",
  }
}
