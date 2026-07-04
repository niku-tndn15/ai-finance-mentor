import { Card, CardContent } from "@/components/ui/card"

export function AiAnswerCard({
  answer,
  nextAction,
  showDisclaimer = true,
}: {
  answer: string
  nextAction: string
  showDisclaimer?: boolean
}) {
  return (
    <Card className="bg-mentor-blue-bg border-transparent">
      <CardContent>
        <p className="text-sm leading-relaxed text-text-primary">{answer}</p>
        <div className="rounded-md bg-surface-card px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-mentor-blue">
            Next best action
          </span>
          <p className="text-sm font-medium text-text-primary">{nextAction}</p>
        </div>
        {showDisclaimer && (
          <p className="text-xs text-text-muted">Based on the information you shared.</p>
        )}
      </CardContent>
    </Card>
  )
}
