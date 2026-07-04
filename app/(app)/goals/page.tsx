import { redirect } from "next/navigation"

import { GoalCard } from "@/components/goals/goal-card"
import { DebtCard } from "@/components/goals/debt-card"
import { AddGoal, AddDebt } from "@/components/goals/add-item"
import { RecommendationCard } from "@/components/goals/recommendation-card"
import { EmptyState } from "@/components/states/empty-state"
import type { DebtDTO, GoalDTO } from "@/components/goals/types"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { computeSafeToUse, loadFinancialModel } from "@/lib/financial-model"
import { buildRecommendation, orderDebts, orderGoals } from "@/lib/coach"
import { emptyStateCopy } from "@/lib/mock-data"

// Milestone 4 — Goal & Debt Coach screen (PRD 04). Real, server-computed data:
// loads the user's goals + debts, orders them (§3 / §5), and derives the single
// recommended action (§6) from safe-to-use money. All interactivity (add / edit /
// delete, Done/Skip/Remind-later) lives in the client child components.
export default async function GoalsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  // Safe-to-use money feeds the save-vs-debt recommendation; no income model
  // means setup isn't done, so there's nothing to coach yet.
  const model = await loadFinancialModel(user.id)
  if (!model) redirect("/onboarding")
  const safe = computeSafeToUse(model)

  const [goalRows, debtRows] = await Promise.all([
    prisma.goal.findMany({ where: { userId: user.id } }),
    prisma.debt.findMany({ where: { userId: user.id } }),
  ])

  const goalViews = orderGoals(goalRows)
  const debtViews = orderDebts(debtRows)
  const recommendation = buildRecommendation(goalViews, debtViews, {
    monthlyAmount: safe.monthlyAmount,
    isNegative: safe.isNegative,
  })

  const goals: GoalDTO[] = goalViews.map((g) => ({
    id: g.id,
    name: g.name,
    category: g.category ?? null,
    targetAmount: g.targetAmount,
    currentSavings: g.currentSavings,
    deadline: toISODate(g.deadline),
    priority: g.priority ?? null,
    flexibility: g.flexibility ?? "flexible",
    monthlyContribution: g.monthlyContribution ?? null,
    progressPercent: g.progressPercent,
    remaining: g.remaining,
    requiredMonthlyContribution: g.requiredMonthlyContribution,
    note: g.note,
  }))

  const debts: DebtDTO[] = debtViews.map((d) => ({
    id: d.id,
    type: d.type,
    outstanding: d.outstanding,
    interestRate: d.interestRate ?? null,
    minimumPayment: d.minimumPayment ?? null,
    dueDate: toISODate(d.dueDate),
    lateFeeRisk: d.lateFeeRisk ?? null,
    stressLevel: d.stressLevel ?? null,
    urgency: d.urgency,
    reasons: d.reasons,
    daysUntilDue: d.daysUntilDue,
  }))

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-text-primary">Goals &amp; Debt</h1>

      {recommendation && <RecommendationCard rec={recommendation} />}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-muted">Goals</h2>
        {goals.length === 0 ? (
          <EmptyState message={emptyStateCopy.noGoal} />
        ) : (
          goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)
        )}
        <AddGoal />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-muted">Debt</h2>
        {debts.length === 0 ? (
          <EmptyState message={emptyStateCopy.noDebt} />
        ) : (
          debts.map((debt) => <DebtCard key={debt.id} debt={debt} />)
        )}
        <AddDebt />
      </section>
    </div>
  )
}

// Stored deadlines/due dates are at UTC midnight, so the date part is stable.
function toISODate(date: Date | null | undefined): string | null {
  return date ? date.toISOString().slice(0, 10) : null
}
