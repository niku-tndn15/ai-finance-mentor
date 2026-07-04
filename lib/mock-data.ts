// Milestone 0.5 prototype data only. Every field here is replaced by the
// real Financial Situation Model (Milestone 2) and Safe-to-Use Money Engine
// (Milestone 3) — nothing here is a live calculation.

export type MoneyZone = "green" | "yellow" | "red" | "locked"
export type ConfidenceLevel = "high" | "medium" | "low"

export const zoneCopy: Record<MoneyZone, { label: string; explanation: string }> = {
  green: { label: "Safe", explanation: "You are spending safely." },
  yellow: { label: "Be careful", explanation: "Slow down to protect your goals." },
  red: { label: "Risky", explanation: "Spending more may hurt bills or savings." },
  locked: { label: "Do not touch", explanation: "This money is protected for bills, debt, or savings." },
}

export interface SafeToUseSnapshot {
  amount: number
  dailySafeSpend: number
  weeklySafeSpend: number
  doNotTouch: number
  confidence: ConfidenceLevel
  zone: MoneyZone
}

export const safeToUseScenarios: Record<"healthy" | "tight" | "negative", SafeToUseSnapshot> = {
  healthy: {
    amount: 12400,
    dailySafeSpend: 620,
    weeklySafeSpend: 3200,
    doNotTouch: 18500,
    confidence: "high",
    zone: "green",
  },
  tight: {
    amount: 2100,
    dailySafeSpend: 140,
    weeklySafeSpend: 780,
    doNotTouch: 21000,
    confidence: "medium",
    zone: "yellow",
  },
  negative: {
    amount: -850,
    dailySafeSpend: 0,
    weeklySafeSpend: 0,
    doNotTouch: 24000,
    confidence: "low",
    zone: "red",
  },
}

export const dailyAction = {
  text: "Move ₹500 to your emergency fund before weekend spending starts.",
  reason: "This keeps your goal on track without affecting your bills.",
}

export const goals = [
  {
    id: "goal-1",
    name: "Emergency fund",
    target: 60000,
    current: 18000,
    deadline: "Dec 2026",
    onTrackNote: "On track if you save ₹4,000 this month.",
  },
]

export type UrgencyLevel = "high" | "medium" | "low"

export const debts = [
  {
    id: "debt-1",
    type: "Credit card",
    outstanding: 24000,
    dueInDays: 3,
    urgency: "high" as UrgencyLevel,
    recommendedAction: "Pay ₹2,000 extra this week if possible.",
  },
]

export const coachPromptChips = [
  "Can I afford this?",
  "What should I do today?",
  "How much should I save this week?",
  "Should I pay debt or save first?",
  "Why am I not saving enough?",
  "Help me reduce spending",
]

export const coachExampleExchange = {
  question: "Can I spend ₹3,000 today?",
  answer:
    "You can spend ₹3,000, but it will move you close to the yellow zone. A safer amount today is ₹1,800. If you still spend ₹3,000, keep tomorrow's spending under ₹400.",
  nextAction: "Set a ₹1,800 limit for today.",
}

export const weeklyReflection = {
  summary: "You completed 4 out of 6 money actions this week.",
  wentWell: ["Stayed under your daily safe spend on 5 of 7 days.", "Paid your credit card on time."],
  gotSkipped: ["Moving ₹500 to your emergency fund (skipped twice)."],
  pattern: "You tend to skip savings actions on weekends.",
  nextAction: "Try moving your savings action to Monday mornings instead.",
  goalProgress: "Emergency fund: 30% complete, up 3% from last week.",
}

export const emptyStateCopy = {
  noGoal: "Add one goal so UrPaisa can guide your money better.",
  noDebt: "No debt added. If you have debt, adding it helps UrPaisa prioritize better.",
  lowConfidence: "Your estimate may be less accurate because a few details are missing.",
  negativeSafeToUse:
    "Your safe to use money is tight this month. Focus on essentials first. Your best action is to review one flexible expense today.",
  aiUnavailable:
    "UrPaisa could not generate a personalized response right now. Here is a safe basic suggestion based on your inputs.",
}

export const habitsSummary = {
  completedCount: 12,
  skippedCount: 4,
  mostCompletedType: "Saving nudges",
  insight: "You're most likely to follow through on savings actions in the morning.",
}
