import { Badge } from "@/components/ui/badge"
import type { ConfidenceLevel } from "@/lib/mock-data"

const variantByLevel = {
  high: "green",
  medium: "yellow",
  low: "red",
} as const

const labelByLevel: Record<ConfidenceLevel, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
}

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return <Badge variant={variantByLevel[level]}>{labelByLevel[level]}</Badge>
}
