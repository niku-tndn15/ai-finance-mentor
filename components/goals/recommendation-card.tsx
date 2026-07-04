import { Lightbulb } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { RecordAction } from "@/components/actions/record-action"
import type { CoachRecommendation } from "@/lib/coach"

// Milestone 4 — the one recommended goal/debt action (PRD 04 §6 / §8). Server
// component; the Done/Skip/Remind-me-later control (RecordAction) is the shared
// client piece that persists the response.
export function RecommendationCard({ rec }: { rec: CoachRecommendation }) {
  return (
    <Card className="border-mentor-blue/30 bg-mentor-blue-bg/40">
      <CardContent className="gap-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="size-4 text-mentor-blue" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide text-mentor-blue">
            Recommended next step
          </span>
        </div>
        <p className="text-base font-medium text-text-primary">{rec.action}</p>
        <p className="text-sm text-text-muted">{rec.reason}</p>
        <RecordAction
          category={rec.category}
          actionKey={rec.actionKey}
          label={rec.action}
          goalId={rec.goalId}
          debtId={rec.debtId}
        />
      </CardContent>
    </Card>
  )
}
