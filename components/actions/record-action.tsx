"use client"

import { ActionButtons, type ActionChoice } from "@/components/money/action-buttons"
import { postJson } from "@/lib/client/api"
import { capture, type AnalyticsEvent } from "@/lib/analytics/events"

// Milestone 4 — the shared, persisting action control. Wraps the presentational
// ActionButtons and writes each Done / Skip / Remind-me-later to /api/actions
// (the one storage schema reused by M5/M6). Everything it needs to identify and
// describe the action is passed in, so any recommendation — goal, debt, or a
// future nudge — can drop this in without new plumbing.

// UI choice → stored ActionResponse enum value.
const RESPONSE: Record<ActionChoice, "done" | "skipped" | "remind_later"> = {
  done: "done",
  skipped: "skipped",
  "remind-later": "remind_later",
}

export function RecordAction({
  category,
  actionKey,
  label,
  goalId,
  debtId,
  completionEvent,
}: {
  category: string
  actionKey: string
  label: string
  goalId?: string
  debtId?: string
  // Optional analytics event fired when the action is marked Done (PRD 00 §9),
  // e.g. "nudge_completed". Only counts a genuine completion, not skip/remind.
  completionEvent?: AnalyticsEvent
}) {
  async function respond(choice: ActionChoice): Promise<boolean> {
    const res = await postJson("/api/actions", {
      category,
      actionKey,
      label,
      response: RESPONSE[choice],
      goalId,
      debtId,
    })
    if (res.ok && choice === "done" && completionEvent) {
      capture(completionEvent, { category, actionKey })
    }
    return res.ok
  }

  return <ActionButtons onRespond={respond} />
}
