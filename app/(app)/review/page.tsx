import { redirect } from "next/navigation"
import { Sparkles, Trophy } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { ReflectionCard } from "@/components/reflection/reflection-card"
import { MonthlyResetSection } from "@/components/reset/monthly-reset-section"
import { RecordAction } from "@/components/actions/record-action"
import { ChallengeParticipation } from "@/components/reflection/challenge-participation"
import { TrackView } from "@/components/analytics/track-view"
import { EVENTS } from "@/lib/analytics/events"
import { getCurrentUser } from "@/lib/auth/session"
import { getOrCreateThisWeekReflection } from "@/lib/reflection/persist"
import { getOrCreateThisMonthReset } from "@/lib/reset"

// Weekly Reflection screen (PRD 08 §2). Real, server-computed from the user's
// actual Done/Skip/Remind-later history. Understandable without any charts (§7):
// a mentor-style summary, one pattern, goal progress, one next action (with the
// shared action buttons), and an optional habit challenge.
export default async function ReviewPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const reflection = await getOrCreateThisWeekReflection(user.id)
  if (!reflection) redirect("/onboarding")

  // Lightweight monthly reset (§3) lives under the same Review tab. Best-effort:
  // if it can't be built the weekly reflection still renders.
  const monthlyReset = await getOrCreateThisMonthReset(user.id)

  return (
    <div className="flex flex-col gap-4">
      <TrackView event={EVENTS.reflectionOpened} />
      <h1 className="text-lg font-semibold text-text-primary">Your Week in Money</h1>

      <p className="text-sm text-text-primary">{reflection.summary}</p>

      <Card>
        <CardContent className="gap-1">
          <span className="text-xs text-text-muted">Actions this week</span>
          <span className="text-lg font-semibold text-text-primary">
            {reflection.completed} of {reflection.total} completed
          </span>
        </CardContent>
      </Card>

      <ReflectionCard title="Pattern detected" items={[reflection.pattern]} />
      <ReflectionCard title="Goal progress" items={[reflection.goalProgress]} />

      <Card className="border-transparent bg-mentor-blue-bg">
        <CardContent>
          <p className="text-sm text-text-primary">{reflection.habitInsight}</p>
        </CardContent>
      </Card>

      {/* One recommended next action (§2), with the shared Done/Skip/Remind buttons. */}
      <Card>
        <CardContent className="gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-mentor-blue">
            Your one next move
          </span>
          <p className="text-base font-medium text-text-primary">{reflection.nextAction}</p>
          <RecordAction
            category={reflection.nextActionCategory}
            actionKey={reflection.nextActionKey}
            label={reflection.nextAction}
          />
        </CardContent>
      </Card>

      {/* Optional MVP-plus habit challenge (§4/§5). */}
      {reflection.challengeTitle && (
        <Card>
          <CardContent className="gap-1">
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-zone-green" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wide text-zone-green">
                This week&apos;s challenge
              </span>
            </div>
            <p className="text-sm font-medium text-text-primary">{reflection.challengeTitle}</p>
            {reflection.challengeDetail && (
              <p className="text-sm text-text-muted">{reflection.challengeDetail}</p>
            )}
            <div className="mt-2">
              <ChallengeParticipation />
            </div>
          </CardContent>
        </Card>
      )}

      {reflection.aiPhrased && (
        <p className="flex items-center gap-1 px-1 text-xs text-text-muted">
          <Sparkles className="size-3" aria-hidden /> Written for you based on your week.
        </p>
      )}

      {monthlyReset && (
        <>
          <hr className="my-2 border-border" />
          <MonthlyResetSection reset={monthlyReset} />
        </>
      )}
    </div>
  )
}
