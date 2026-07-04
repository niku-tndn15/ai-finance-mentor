import { prisma } from "@/lib/db"

import type { FinancialModelInput } from "./types"

// Loads a user's whole financial situation from the DB and maps it into the
// plain FinancialModelInput the compute/safe-to-use services run on. Returns
// null when the user hasn't completed Financial Setup yet (no Income row), so
// callers can redirect to onboarding rather than compute against nothing.
//
// Server-only (imports the Prisma client). One query per entity, all keyed by
// userId; kept simple rather than a single deep include because the shapes the
// engine needs are narrow projections, not the full rows.
export async function loadFinancialModel(userId: string): Promise<FinancialModelInput | null> {
  const [income, fixedExpenses, subscriptions, goals, debts] = await Promise.all([
    prisma.income.findUnique({ where: { userId } }),
    prisma.fixedExpense.findMany({ where: { userId } }),
    prisma.subscription.findMany({ where: { userId } }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.debt.findMany({ where: { userId } }),
  ])

  if (!income) return null

  return {
    income: {
      monthlyAmount: income.monthlyAmount,
      stability: income.stability,
      plannedSavings: income.plannedSavings,
      irregularIncome: income.irregularIncome,
      bonusIncome: income.bonusIncome,
      payday: income.payday,
    },
    fixedExpenses: fixedExpenses.map((e) => ({ amount: e.amount, negotiability: e.negotiability })),
    subscriptions: subscriptions.map((s) => ({ amount: s.amount })),
    goals: goals.map((g) => ({
      targetAmount: g.targetAmount,
      currentSavings: g.currentSavings,
      deadline: g.deadline,
      monthlyContribution: g.monthlyContribution,
    })),
    debts: debts.map((d) => ({
      outstanding: d.outstanding,
      interestRate: d.interestRate,
      minimumPayment: d.minimumPayment,
      dueDate: d.dueDate,
      lateFeeRisk: d.lateFeeRisk,
      stressLevel: d.stressLevel,
    })),
  }
}
