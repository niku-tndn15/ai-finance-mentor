import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"
import { fail, ok, parseBody } from "@/lib/http"
import {
  financialSetupSchema,
  type FinancialSetupInput,
} from "@/lib/validation/financial-model"
import type { IncomeStability } from "@prisma/client"

// Milestone 2 — persist the whole financial situation model in one call
// (IMPLEMENTATION_PLAN.md M2). Onboarding + Financial Setup are captured across
// several client screens and submitted here together.
//
// This endpoint is idempotent: re-running setup (the user edits and resubmits)
// fully replaces the prior model rather than appending duplicates. Profile and
// Income are upserted (one per user); the list entities are cleared and
// recreated inside a transaction so a partial write can never leave the model
// half-updated.

// Income stability isn't asked directly in onboarding — it's derived from the
// income type so setup stays short (PRD 02 §2 note; schema comment).
const STABILITY_BY_INCOME_TYPE: Record<
  FinancialSetupInput["onboarding"]["incomeType"],
  IncomeStability
> = {
  fixed_salary: "high",
  mixed_income: "medium",
  variable_income: "low",
}

// A YYYY-MM-DD string (already regex-validated by zod) → a UTC Date, or null.
function toDate(value: string | undefined): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return fail("Please log in to continue.", 401)

  const parsed = await parseBody(req, financialSetupSchema)
  if (!parsed.ok) return parsed.response

  const { onboarding, income, fixedExpenses, subscriptions, goals, debts } = parsed.data
  const userId = user.id
  const stability = STABILITY_BY_INCOME_TYPE[onboarding.incomeType]

  await prisma.$transaction(async (tx) => {
    await tx.profile.upsert({
      where: { userId },
      create: {
        userId,
        userType: onboarding.userType,
        incomeType: onboarding.incomeType,
        coachingTone: onboarding.coachingTone,
        primaryGoal: onboarding.primaryGoal,
      },
      update: {
        userType: onboarding.userType,
        incomeType: onboarding.incomeType,
        coachingTone: onboarding.coachingTone,
        primaryGoal: onboarding.primaryGoal,
      },
    })

    await tx.income.upsert({
      where: { userId },
      create: {
        userId,
        monthlyAmount: income.monthlyAmount,
        payday: income.payday,
        plannedSavings: income.plannedSavings,
        stability,
      },
      update: {
        monthlyAmount: income.monthlyAmount,
        payday: income.payday,
        plannedSavings: income.plannedSavings,
        stability,
      },
    })

    // Replace the list-entity rows wholesale (idempotent re-run).
    await Promise.all([
      tx.fixedExpense.deleteMany({ where: { userId } }),
      tx.subscription.deleteMany({ where: { userId } }),
      tx.goal.deleteMany({ where: { userId } }),
      tx.debt.deleteMany({ where: { userId } }),
    ])

    if (fixedExpenses.length > 0) {
      await tx.fixedExpense.createMany({
        data: fixedExpenses.map((e) => ({
          userId,
          category: e.category,
          amount: e.amount,
          negotiability: e.negotiability,
        })),
      })
    }

    if (subscriptions.length > 0) {
      await tx.subscription.createMany({
        data: subscriptions.map((s) => ({
          userId,
          name: s.name,
          amount: s.amount,
          negotiability: s.negotiability,
        })),
      })
    }

    await tx.goal.createMany({
      data: goals.map((g) => ({
        userId,
        name: g.name,
        targetAmount: g.targetAmount,
        currentSavings: g.currentSavings,
        deadline: toDate(g.deadline),
        priority: g.priority,
        flexibility: g.flexibility,
        monthlyContribution: g.monthlyContribution,
      })),
    })

    if (debts.length > 0) {
      await tx.debt.createMany({
        data: debts.map((d) => ({
          userId,
          type: d.type,
          outstanding: d.outstanding,
          interestRate: d.interestRate,
          minimumPayment: d.minimumPayment,
          dueDate: toDate(d.dueDate),
          lateFeeRisk: d.lateFeeRisk,
          stressLevel: d.stressLevel,
        })),
      })
    }
  })

  return ok({ redirect: "/result" })
}
