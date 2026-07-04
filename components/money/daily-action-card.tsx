import { Card, CardContent } from "@/components/ui/card"
import { ActionButtons } from "@/components/money/action-buttons"

export function DailyActionCard({ text, reason }: { text: string; reason: string }) {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-mentor-blue">
            Today&apos;s action
          </span>
          <p className="text-base font-medium text-text-primary">{text}</p>
          <p className="text-sm text-text-muted">{reason}</p>
        </div>
        <ActionButtons />
      </CardContent>
    </Card>
  )
}
