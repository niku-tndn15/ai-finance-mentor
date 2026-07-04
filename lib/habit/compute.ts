import type { NudgeType } from "@/lib/nudge"

import type { HabitActionInput, HabitDimension, HabitProfile, HabitSignal, TypeStat } from "./types"

// Milestone 6 — turn stored Done/Skip/Remind-later history into a habit profile
// (PRD 06 §2–§5). Pure, with an injectable `now`.

const NUDGE_TYPES: NudgeType[] = [
  "payday",
  "weekend",
  "subscription",
  "goal",
  "debt",
  "impulse",
  "low_money",
  "safe_spend",
]

// Soft types that may be suppressed after repeated skips. Essentials (debt,
// low_money) and the general safe-spend floor are never suppressed — you can't
// hide an overdue bill or leave a day with no guidance just because the user
// skipped it (§3, reconciled with M5 §4 priority).
const SUPPRESSIBLE: NudgeType[] = ["payday", "weekend", "subscription", "goal", "impulse"]

// Map a stored action back to the single nudge type it informs. Goal and payday
// both write `goal-contribution:*`; we attribute that to `goal` and treat payday
// + goal together as the "saving family" below.
export function actionKeyToType(actionKey: string, category: string): NudgeType | null {
  if (actionKey.startsWith("debt-")) return "debt"
  if (actionKey === "payday-save") return "payday"
  if (actionKey.startsWith("goal-contribution")) return "goal"
  if (actionKey === "subscription-cleanup") return "subscription"
  if (actionKey === "weekend-limit") return "weekend"
  if (actionKey === "safe-spend-day") return "safe_spend"
  if (actionKey === "impulse-24h") return "impulse"
  if (actionKey === "protect-essentials") return "low_money"
  // Fallback for M4 recommendation categories that don't carry a nudge actionKey.
  if (category === "debt") return "debt"
  if (category === "goal") return "goal"
  if (category === "subscription") return "subscription"
  if (category === "impulse") return "impulse"
  return null
}

function emptyStat(): TypeStat {
  return { done: 0, skip: 0, remind: 0 }
}

// Laplace-smoothed completion rate → a readiness in (0,1). Done raises it,
// repeated Skip lowers it, Remind is excluded entirely (§3).
function readinessFrom(done: number, skip: number): number {
  return (done + 0.5) / (done + skip + 1)
}

function signalFrom(done: number, skip: number): HabitSignal {
  const count = done + skip
  if (count === 0) return "unknown"
  const rate = done / count
  if (count >= 2 && rate >= 0.7) return "strong"
  if (rate >= 0.4) return "building"
  return "weak"
}

const SIGNAL_DETAIL: Record<HabitSignal, string> = {
  strong: "You usually follow through here.",
  building: "You're starting to build this one.",
  weak: "There's room to grow this habit.",
  unknown: "Not enough activity yet to tell.",
}

export function computeHabitProfile(records: HabitActionInput[]): HabitProfile {
  const perType: Record<NudgeType, TypeStat> = Object.fromEntries(
    NUDGE_TYPES.map((t) => [t, emptyStat()])
  ) as Record<NudgeType, TypeStat>

  let morning = 0
  let evening = 0

  for (const r of records) {
    const type = actionKeyToType(r.actionKey, r.category)
    if (type) {
      const stat = perType[type]
      if (r.response === "done") stat.done++
      else if (r.response === "skipped") stat.skip++
      else stat.remind++
    }
    if (r.response === "done") {
      const hour = r.createdAt.getHours()
      if (hour < 12) morning++
      else if (hour >= 17) evening++
    }
  }

  // Saving family = payday + goal, since a save can be logged under either.
  const savingDone = perType.payday.done + perType.goal.done
  const savingSkip = perType.payday.skip + perType.goal.skip

  // --- Readiness hints (§4) ---
  const readinessHints: Partial<Record<NudgeType, number>> = {}
  if (savingDone + savingSkip >= 1) {
    const r = readinessFrom(savingDone, savingSkip)
    readinessHints.goal = r
    readinessHints.payday = r
  }
  for (const t of ["debt", "subscription", "weekend", "impulse", "safe_spend"] as NudgeType[]) {
    const s = perType[t]
    if (s.done + s.skip >= 1) readinessHints[t] = readinessFrom(s.done, s.skip)
  }

  const subscriptionCleanupDone = perType.subscription.done >= 1
  // §5 low-friction follow-up: after a subscription cleanup, lean into small saves.
  if (subscriptionCleanupDone) {
    readinessHints.goal = Math.min(1, (readinessHints.goal ?? 0.85) + 0.1)
  }

  // --- Suppression: repeatedly skipped soft types (§3) ---
  const suppressedTypes: NudgeType[] = SUPPRESSIBLE.filter((t) => {
    if (t === "payday" || t === "goal") return savingSkip >= 2 && savingDone === 0
    const s = perType[t]
    return s.skip >= 2 && s.done === 0
  })

  // §5 smaller-ask: skips saving more than completes it → ask for less.
  const preferSmallerSaves = savingSkip >= 1 && savingSkip > savingDone

  const totalResponses = records.length
  const timeOfDay =
    morning + evening === 0
      ? "unknown"
      : morning > evening * 2
        ? "morning"
        : evening > morning * 2
          ? "evening"
          : "mixed"

  return {
    totalResponses,
    perType,
    readinessHints,
    suppressedTypes,
    preferSmallerSaves,
    subscriptionCleanupDone,
    timeOfDay,
    dimensions: buildDimensions(perType, savingDone, savingSkip),
  }
}

// The seven §2 dimensions, each reduced to a signal for the weekly insight (§7).
function buildDimensions(
  perType: Record<NudgeType, TypeStat>,
  savingDone: number,
  savingSkip: number
): HabitDimension[] {
  // Spending timing is proxied by staying within weekend / safe-spend limits,
  // since Phase 1 has no live spend tracking.
  const spendDone = perType.weekend.done + perType.safe_spend.done
  const spendSkip = perType.weekend.skip + perType.safe_spend.skip

  const allDone = Object.values(perType).reduce((n, s) => n + s.done, 0)
  const allSkip = Object.values(perType).reduce((n, s) => n + s.skip, 0)

  const defs: Array<{ key: string; label: string; done: number; skip: number }> = [
    { key: "saving", label: "Saving after payday", done: savingDone, skip: savingSkip },
    { key: "spending_timing", label: "Staying within limits", done: spendDone, skip: spendSkip },
    { key: "subscription", label: "Subscription discipline", done: perType.subscription.done, skip: perType.subscription.skip },
    { key: "debt", label: "Paying debt on time", done: perType.debt.done, skip: perType.debt.skip },
    { key: "goal", label: "Goal consistency", done: perType.goal.done, skip: perType.goal.skip },
    { key: "impulse", label: "Impulse control", done: perType.impulse.done, skip: perType.impulse.skip },
    { key: "nudge_response", label: "Responding to nudges", done: allDone, skip: allSkip },
  ]

  return defs.map(({ key, label, done, skip }) => {
    const signal = signalFrom(done, skip)
    return { key, label, signal, detail: SIGNAL_DETAIL[signal] }
  })
}
