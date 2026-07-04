"use client"

import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export function SelectableCard({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors",
        selected
          ? "border-mentor-blue bg-mentor-blue-bg text-mentor-blue"
          : "border-border bg-surface-card text-text-primary hover:bg-muted"
      )}
    >
      {label}
      {selected && <Check className="size-4 shrink-0" aria-hidden />}
    </button>
  )
}
