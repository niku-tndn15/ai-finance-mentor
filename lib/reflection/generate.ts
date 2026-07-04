import type { NudgeType } from "@/lib/nudge"

import { pickChallenge } from "./challenge"
import type { ReflectionContent, ReflectionInput } from "./types"

// Milestone 8 — build the weekly reflection deterministically from real history
// (PRD 08 §2). Pure. AI (in persist) only rephrases `summary`.

// Human-readable, action-oriented labels for each nudge type.
const TYPE_LABEL: Record<NudgeType, string> = {
  payday: "saving on payday",
  weekend: "weekend spending limits",
  subscription: "subscription cleanup",
  goal: "goal contributions",
  debt: "debt payments",
  impulse: "the 24-hour impulse pause",
  low_money: "protecting essentials",
  safe_spend: "staying within your safe spend",
}

const NUDGE_TYPES = Object.keys(TYPE_LABEL) as NudgeType[]

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`
}

// The type with the most Done (or Skip) responses, or null if none.
function topBy(profile: ReflectionInput["profile"], key: "done" | "skip"): { type: NudgeType; count: number } | null {
  let best: { type: NudgeType; count: number } | null = null
  for (const t of NUDGE_TYPES) {
    const count = profile.perType[t][key]
    if (count > 0 && (!best || count > best.count)) best = { type: t, count }
  }
  return best
}

export function buildReflection(input: ReflectionInput): ReflectionContent {
  const { profile, goals, recommendation, insight, model } = input

  const completed = NUDGE_TYPES.reduce((n, t) => n + profile.perType[t].done, 0)
  const skipped = NUDGE_TYPES.reduce((n, t) => n + profile.perType[t].skip, 0)
  const total = completed + skipped

  const mostDone = topBy(profile, "done")
  const mostSkip = topBy(profile, "skip")

  const summary = buildSummary(completed, total, mostDone, mostSkip)
  const pattern = buildPattern(profile, mostDone, mostSkip)

  // One recommended action — the coach's, or a safe default (§2).
  const nextAction = recommendation?.action ?? "Save a small amount right after your next payday."
  const nextActionCategory = recommendation?.category ?? "general"
  const nextActionKey = recommendation?.actionKey ?? "reflection-next"

  const challenge = pickChallenge(profile, model)

  return {
    completed,
    total,
    summary,
    pattern,
    nextAction,
    nextActionCategory,
    nextActionKey,
    goalProgress: buildGoalProgress(goals),
    habitInsight: insight.hasData
      ? insight.focus
      : "Keep responding to your daily actions and I'll track your habits here.",
    challengeTitle: challenge.title,
    challengeDetail: challenge.detail,
  }
}

function buildSummary(
  completed: number,
  total: number,
  mostDone: { type: NudgeType } | null,
  mostSkip: { type: NudgeType; count: number } | null
): string {
  if (total === 0) {
    return "You didn't log any money actions this week — no pressure. Next week, even one small action starts the habit."
  }
  const well = mostDone ? `You were strong on ${TYPE_LABEL[mostDone.type]}.` : "You showed up to check in on your money."
  const slip = mostSkip
    ? ` You skipped ${TYPE_LABEL[mostSkip.type]} ${mostSkip.count} time${mostSkip.count === 1 ? "" : "s"}.`
    : ""
  return `This week, you completed ${completed} of ${total} money actions. ${well}${slip}`
}

// One detected pattern (§2), most salient first.
function buildPattern(
  profile: ReflectionInput["profile"],
  mostDone: { type: NudgeType } | null,
  mostSkip: { type: NudgeType; count: number } | null
): string {
  if (mostSkip && mostSkip.count >= 2) {
    const when = profile.timeOfDay === "evening" ? ", usually later in the day" : ""
    return `You tend to skip ${TYPE_LABEL[mostSkip.type]}${when}.`
  }
  if (profile.timeOfDay === "evening") {
    return "You tend to act on your money in the evenings."
  }
  if (mostDone) {
    return `You follow through best on ${TYPE_LABEL[mostDone.type]}.`
  }
  return "Not enough activity yet to spot a clear pattern — a few more actions will reveal one."
}

function buildGoalProgress(goals: ReflectionInput["goals"]): string {
  const goal = goals.find((g) => g.remaining > 0) ?? goals[0]
  if (!goal) return "No goals set yet — add one so I can track your progress."
  const toGo = goal.remaining > 0 ? ` — ${inr(goal.remaining)} to go` : " — reached! 🎉"
  return `${goal.name}: ${goal.progressPercent}% complete${toGo}.`
}
