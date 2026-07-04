import { Check, TriangleAlert, OctagonAlert, Lock } from "lucide-react"

import { cn } from "@/lib/utils"
import { type MoneyZone, zoneCopy } from "@/lib/mock-data"

const zoneStyles: Record<MoneyZone, { bg: string; text: string; icon: typeof Check }> = {
  green: { bg: "bg-zone-green-bg", text: "text-zone-green", icon: Check },
  yellow: { bg: "bg-zone-yellow-bg", text: "text-zone-yellow", icon: TriangleAlert },
  red: { bg: "bg-zone-red-bg", text: "text-zone-red", icon: OctagonAlert },
  locked: { bg: "bg-zone-locked-bg", text: "text-zone-locked", icon: Lock },
}

// `message` optionally overrides the generic explanation with the real
// Safe-to-Use engine copy (PRD 03 §4); omit it for the prototype/static case.
export function ZoneMeter({
  zone,
  message,
  className,
}: {
  zone: MoneyZone
  message?: string
  className?: string
}) {
  const style = zoneStyles[zone]
  const Icon = style.icon
  const copy = zoneCopy[zone]

  return (
    <div
      className={cn("flex items-center gap-3 rounded-lg p-3", style.bg, className)}
      data-zone={zone}
    >
      <Icon className={cn("size-5 shrink-0", style.text)} aria-hidden />
      <div className="flex flex-col">
        <span className={cn("text-sm font-semibold", style.text)}>{copy.label}</span>
        <span className="text-xs text-text-muted">{message ?? copy.explanation}</span>
      </div>
    </div>
  )
}
