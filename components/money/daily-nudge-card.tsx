import { Sparkles } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { RecordAction } from "@/components/actions/record-action"
import { EVENTS } from "@/lib/analytics/events"

// Milestone 5 — the one recommended action on the Daily Mentor screen. Renders
// the full nudge anatomy (PRD 05 §5: trigger, action, reason, expected benefit)
// and the shared Done/Skip/Remind-later control. Server component; RecordAction
// is the client piece that persists the response.
export function DailyNudgeCard({
  nudge,
}: {
  nudge: {
    trigger: string
    action: string
    reason: string
    expectedBenefit: string
    actionKey: string
    category: string
    goalId: string | null
    debtId: string | null
  }
}) {
  return (
    <Card>
      <CardContent className="gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-mentor-blue" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide text-mentor-blue">
            Today&apos;s action
          </span>
        </div>

        <p className="text-xs text-text-muted">{nudge.trigger}</p>
        <p className="text-base font-medium text-text-primary">{nudge.action}</p>
        <p className="text-sm text-text-muted">{nudge.reason}</p>
        <p className="text-xs text-zone-green">{nudge.expectedBenefit}</p>

        <RecordAction
          category={nudge.category}
          actionKey={nudge.actionKey}
          label={nudge.action}
          goalId={nudge.goalId ?? undefined}
          debtId={nudge.debtId ?? undefined}
          completionEvent={EVENTS.nudgeCompleted}
        />
      </CardContent>
    </Card>
  )
}
