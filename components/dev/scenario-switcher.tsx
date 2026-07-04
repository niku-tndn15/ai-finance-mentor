import Link from "next/link"

import { cn } from "@/lib/utils"

const defaultOptions = [
  { value: "healthy", label: "Healthy" },
  { value: "tight", label: "Tight" },
  { value: "negative", label: "Negative" },
]

// Prototype-only helper (Milestone 0.5) so every required state — empty,
// low-confidence, negative safe-to-use — is reachable and reviewable
// without a backend. Not part of the shipped product surface.
export function ScenarioSwitcher({
  current,
  basePath,
  options = defaultOptions,
  paramName = "scenario",
}: {
  current: string
  basePath: string
  options?: { value: string; label: string }[]
  paramName?: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/50 p-2">
      <span className="px-1 text-[0.65rem] font-semibold uppercase tracking-wide text-text-muted">
        Preview state
      </span>
      {options.map((option) => (
        <Link
          key={option.value}
          href={`${basePath}?${paramName}=${option.value}`}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            current === option.value
              ? "bg-mentor-blue text-white"
              : "bg-surface-card text-text-muted"
          )}
        >
          {option.label}
        </Link>
      ))}
    </div>
  )
}
