import { Card } from "@/components/ui/card"
import { ConfidenceBadge } from "@/components/money/confidence-badge"
import type { ConfidenceLevel } from "@/lib/mock-data"

function formatRupees(amount: number) {
  const abs = Math.abs(amount).toLocaleString("en-IN")
  return amount < 0 ? `-₹${abs}` : `₹${abs}`
}

export function SafeToUseCard({
  amount,
  confidence,
  subtext = "After must-pay expenses, planned savings, and debt commitments.",
}: {
  amount: number
  confidence: ConfidenceLevel
  subtext?: string
}) {
  const isNegative = amount < 0

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-text-muted">
          {isNegative ? "Your safe to use money is tight" : "Safe to use this month"}
        </span>
        <ConfidenceBadge level={confidence} />
      </div>
      <span
        className={
          "text-4xl font-bold tracking-tight " +
          (isNegative ? "text-zone-red" : "text-text-primary")
        }
      >
        {formatRupees(amount)}
      </span>
      <p className="text-sm text-text-muted">{subtext}</p>

      {/* In-context estimate disclaimer (PRD 09 §5). Shown when confidence is
          medium so the number never reads as a guarantee. Low confidence is
          already covered by the stronger, exact-wording §7 disclaimer that the
          screens render below the card, so we don't double it up here. */}
      {confidence === "medium" && (
        <p className="text-xs text-text-muted">This is an estimate based on your inputs.</p>
      )}
    </Card>
  )
}
