import { Badge } from "@/components/ui/badge"
import { DEBT_URGENCY_LABEL, type DebtUrgency } from "@/lib/coach"

// PRD 04 §5 urgency buckets → the shared zone colours (red = highest, yellow =
// medium, neutral = lower).
const variantByLevel: Record<DebtUrgency, "red" | "yellow" | "neutral"> = {
  highest: "red",
  medium: "yellow",
  lower: "neutral",
}

export function UrgencyBadge({ level }: { level: DebtUrgency }) {
  return <Badge variant={variantByLevel[level]}>{DEBT_URGENCY_LABEL[level]}</Badge>
}
