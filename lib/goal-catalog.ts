export const goalOptions = [
  "Save more monthly",
  "Build emergency fund",
  "Pay off debt",
  "Control spending",
  "Plan a purchase",
  "Start investing later",
  "Travel savings",
] as const

export type GoalOption = (typeof goalOptions)[number]

// Mirrors the default goal priority ordering — IMPLEMENTATION_PLAN.md Milestone 4 §3
// (emergency fund → high-interest debt → essential obligations → time-bound goals →
// lifestyle → investing readiness). Used here only to pick which of the user's
// selected goals drives today's action in the Milestone 0.5 prototype; the real
// scoring (urgency/readiness/impact) is Milestone 5's job.
const priorityOrder: GoalOption[] = [
  "Build emergency fund",
  "Pay off debt",
  "Control spending",
  "Plan a purchase",
  "Travel savings",
  "Save more monthly",
  "Start investing later",
]

export function pickTopGoal(selected: GoalOption[]): GoalOption | undefined {
  return priorityOrder.find((goal) => selected.includes(goal)) ?? selected[0]
}

export const actionByGoal: Record<GoalOption, { text: string; reason: string }> = {
  "Build emergency fund": {
    text: "Move ₹500 to your emergency fund before weekend spending starts.",
    reason: "This keeps your emergency fund on track without affecting your bills.",
  },
  "Pay off debt": {
    text: "Pay ₹500 extra toward your highest-interest debt this week.",
    reason: "Clearing high-interest debt first saves you more than saving would earn.",
  },
  "Control spending": {
    text: "Set a ₹400 spending limit for today.",
    reason: "Small daily limits are the fastest way to build spending control.",
  },
  "Plan a purchase": {
    text: "Set aside ₹500 today toward your planned purchase.",
    reason: "Steady small transfers get you there without one big hit to your budget.",
  },
  "Travel savings": {
    text: "Move ₹500 into your travel fund today.",
    reason: "Consistent small transfers add up before your trip.",
  },
  "Save more monthly": {
    text: "Move ₹500 to savings before weekend spending starts.",
    reason: "This keeps you on pace for your monthly savings target.",
  },
  "Start investing later": {
    text: "Move ₹500 to your emergency fund first.",
    reason: "Building a safety net now makes investing later less risky.",
  },
}
