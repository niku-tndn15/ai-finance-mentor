"use client"

import { useEffect, useState } from "react"

import { DailyActionCard } from "@/components/money/daily-action-card"
import { dailyAction as fallbackAction } from "@/lib/mock-data"
import { actionByGoal, pickTopGoal, type GoalOption } from "@/lib/goal-catalog"
import { readSelectedGoals } from "@/lib/onboarding-store"

// Prototype-level "recommendation" — picks the highest-priority goal from
// what the user selected in onboarding (lib/goal-catalog.ts priority order)
// and swaps in the matching action. Real scoring (urgency/readiness/impact
// from actual financial data) is Milestone 5's job.
export function PersonalizedDailyAction() {
  const [goals, setGoals] = useState<GoalOption[]>([])

  useEffect(() => {
    setGoals(readSelectedGoals())
  }, [])

  const topGoal = goals.length > 0 ? pickTopGoal(goals) : undefined
  const action = topGoal ? actionByGoal[topGoal] : fallbackAction
  const otherGoals = goals.filter((goal) => goal !== topGoal)

  return (
    <div className="flex flex-col gap-2">
      <DailyActionCard text={action.text} reason={action.reason} />
      {otherGoals.length > 0 && (
        <p className="px-1 text-xs text-text-muted">
          You also chose {otherGoals.join(", ")} — we&apos;ll get to these next based on priority.
        </p>
      )}
    </div>
  )
}
