import type { CoachGoal, CoachGoalView, GoalCategoryValue } from "./types"

// Milestone 4 — Goal coach rules (PRD 04 §2 / §3). Pure functions over CoachGoal.

// Default priority ranks (PRD 04 §3). High-interest debt is §3's rank 2 but it's
// a Debt, not a goal category, so goal ranks skip it: 1, then 3–6. Lower =
// higher priority.
const CATEGORY_RANK: Record<GoalCategoryValue, number> = {
  emergency_fund: 1,
  essential_obligation: 3,
  time_bound: 4,
  lifestyle: 5,
  investing: 6,
}

// An uncategorised goal (created before goal type existed, or left blank) can't
// be placed by §3, so it drops below every categorised goal — with a deadline it
// behaves like a time-bound goal, otherwise like a lifestyle goal.
function defaultRankFor(goal: CoachGoal): number {
  if (goal.category) return CATEGORY_RANK[goal.category]
  return goal.deadline ? CATEGORY_RANK.time_bound : CATEGORY_RANK.lifestyle
}

// Effective rank: an explicit user priority overrides the §3 default ("The user
// can override priority", §3). Both live in the same low-number-wins space.
export function effectiveRank(goal: CoachGoal): number {
  return goal.priority ?? defaultRankFor(goal)
}

// Whole months from `now` to `deadline`, floored at 1 so a due-now goal doesn't
// divide by zero. Null when there's no deadline.
function monthsUntil(deadline: Date | null | undefined, now: Date): number | null {
  if (!deadline) return null
  const ms = deadline.getTime() - now.getTime()
  const months = Math.ceil(ms / (1000 * 60 * 60 * 24 * 30))
  return Math.max(1, months)
}

function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`
}

export function buildGoalView(goal: CoachGoal, now: Date = new Date()): CoachGoalView {
  const target = Math.max(0, goal.targetAmount)
  const current = Math.max(0, goal.currentSavings)
  const remaining = Math.max(0, target - current)
  const progressPercent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0

  const monthsToDeadline = monthsUntil(goal.deadline, now)

  // Prefer an explicit monthlyContribution; otherwise spread the remaining amount
  // over the months to the deadline (PRD 04 §2 "Monthly contribution needed").
  let requiredMonthlyContribution: number | null
  if (remaining === 0) {
    requiredMonthlyContribution = 0
  } else if (goal.monthlyContribution != null) {
    requiredMonthlyContribution = Math.max(0, goal.monthlyContribution)
  } else if (monthsToDeadline != null) {
    requiredMonthlyContribution = Math.ceil(remaining / monthsToDeadline)
  } else {
    requiredMonthlyContribution = null
  }

  return {
    ...goal,
    progressPercent,
    remaining,
    requiredMonthlyContribution,
    monthsToDeadline,
    defaultRank: defaultRankFor(goal),
    note: buildNote(goal.name, progressPercent, remaining, requiredMonthlyContribution),
  }
}

// Plain-language progress line, tone per PRD 04 §2 example.
function buildNote(
  name: string,
  progressPercent: number,
  remaining: number,
  requiredMonthly: number | null
): string {
  if (remaining === 0) return `You've reached your ${name} goal — nicely done.`
  if (requiredMonthly && requiredMonthly > 0) {
    return `You're ${progressPercent}% of the way to your ${name}. Setting aside about ${formatINR(requiredMonthly)} a month keeps you on track.`
  }
  return `You're ${progressPercent}% of the way to your ${name}. Add what you can when your safe-to-use money allows.`
}

// Default priority ordering (PRD 04 §3) with user override. Ties break by nearer
// deadline first (a goal with no deadline sorts last), then by more still to save.
export function orderGoals(goals: CoachGoal[], now: Date = new Date()): CoachGoalView[] {
  return goals
    .map((g) => buildGoalView(g, now))
    .sort((a, b) => {
      const rank = effectiveRank(a) - effectiveRank(b)
      if (rank !== 0) return rank

      // On a tie, a goal the user explicitly prioritised wins — an override at
      // the same number as a default rank still reads as "I mean this one".
      const explicit = Number(b.priority != null) - Number(a.priority != null)
      if (explicit !== 0) return explicit

      const aDue = a.deadline ? a.deadline.getTime() : Infinity
      const bDue = b.deadline ? b.deadline.getTime() : Infinity
      if (aDue !== bDue) return aDue - bDue

      return b.remaining - a.remaining
    })
}
