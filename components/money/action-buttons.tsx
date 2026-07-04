"use client"

import { useState } from "react"
import { Check, Clock, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ActionChoice = "done" | "skipped" | "remind-later"
type ActionState = "pending" | ActionChoice

const confirmationCopy: Record<ActionChoice, string> = {
  done: "Nice work — marked as done.",
  skipped: "No worries, skipped for today.",
  "remind-later": "We'll remind you later.",
}

// Shared Done / Skip / Remind-me-later control (IMPLEMENTATION_PLAN.md M4: one
// component reused by M5/M6). Presentational: it renders the buttons and the
// confirmation. Persistence is injected via `onRespond` — when it resolves false
// (a save failed) the control reverts to pending so the user can retry, and no
// raw error ever reaches the UI (PRD 09 §7). With no `onRespond` it's a pure UI
// stub (prototype daily-action card).
export function ActionButtons({
  onRespond,
}: {
  onRespond?: (choice: ActionChoice) => Promise<boolean> | boolean | void
}) {
  const [state, setState] = useState<ActionState>("pending")
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  async function choose(next: ActionChoice) {
    if (pending) return
    setFailed(false)
    setState(next)

    if (!onRespond) return
    setPending(true)
    try {
      const result = await onRespond(next)
      if (result === false) {
        setState("pending")
        setFailed(true)
      }
    } catch {
      setState("pending")
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  if (state !== "pending") {
    return (
      <p
        className={cn(
          "rounded-lg px-3 py-2 text-sm font-medium",
          state === "done" && "bg-zone-green-bg text-zone-green",
          state === "skipped" && "bg-muted text-text-muted",
          state === "remind-later" && "bg-mentor-blue-bg text-mentor-blue"
        )}
      >
        {confirmationCopy[state]}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <Button className="flex-1" disabled={pending} onClick={() => choose("done")}>
          <Check /> Done
        </Button>
        <Button variant="outline" className="flex-1" disabled={pending} onClick={() => choose("skipped")}>
          <X /> Skip
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Remind me later"
          disabled={pending}
          onClick={() => choose("remind-later")}
        >
          <Clock />
        </Button>
      </div>
      {failed && (
        <p className="text-xs text-zone-red">Couldn&apos;t save that just now — tap to try again.</p>
      )}
    </div>
  )
}
