import { redirect } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { buildWeeklyInsight, computeHabitProfile, type HabitSignal } from "@/lib/habit"

// Milestone 6 — Habits screen: the lightweight weekly habit insight (PRD 06 §7),
// computed live from the user's real Done/Skip/Remind-later history. No formal
// Money Health Score (explicitly Phase 2+).
const HABIT_WINDOW_MS = 60 * 24 * 60 * 60 * 1000

const signalVariant: Record<HabitSignal, "green" | "blue" | "yellow" | "neutral"> = {
  strong: "green",
  building: "blue",
  weak: "yellow",
  unknown: "neutral",
}

const signalLabel: Record<HabitSignal, string> = {
  strong: "Strong",
  building: "Building",
  weak: "Growing",
  unknown: "No data yet",
}

export default async function HabitsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const records = await prisma.actionRecord.findMany({
    where: { userId: user.id, createdAt: { gte: new Date(Date.now() - HABIT_WINDOW_MS) } },
    select: { category: true, actionKey: true, response: true, createdAt: true },
  })

  const profile = computeHabitProfile(records)
  const insight = buildWeeklyInsight(profile)

  const completed = Object.values(profile.perType).reduce((n, s) => n + s.done, 0)
  const skipped = Object.values(profile.perType).reduce((n, s) => n + s.skip, 0)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-text-primary">Your habits</h1>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="gap-1">
            <span className="text-xs text-text-muted">Completed</span>
            <span className="text-lg font-semibold text-zone-green">{completed}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="gap-1">
            <span className="text-xs text-text-muted">Skipped</span>
            <span className="text-lg font-semibold text-text-muted">{skipped}</span>
          </CardContent>
        </Card>
      </div>

      {/* Weekly insight (§7) */}
      <Card className="border-transparent bg-mentor-blue-bg">
        <CardContent className="gap-2">
          <p className="text-sm font-medium text-text-primary">{insight.headline}</p>
          {insight.strongest && <p className="text-sm text-text-primary">{insight.strongest}</p>}
          {insight.weakest && <p className="text-sm text-text-primary">{insight.weakest}</p>}
          <p className="text-sm text-text-muted">{insight.focus}</p>
          {insight.timeNote && <p className="text-xs text-text-muted">{insight.timeNote}</p>}
        </CardContent>
      </Card>

      {/* The seven habit dimensions (§2) */}
      {insight.hasData && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-text-muted">Habit signals</h2>
          {profile.dimensions.map((dim) => (
            <Card key={dim.key}>
              <CardContent className="flex-row items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-text-primary">{dim.label}</span>
                  <span className="text-xs text-text-muted">{dim.detail}</span>
                </div>
                <Badge variant={signalVariant[dim.signal]}>{signalLabel[dim.signal]}</Badge>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </div>
  )
}
