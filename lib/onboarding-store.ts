import type { GoalOption } from "@/lib/goal-catalog"

// Milestone 0.5 prototype only — localStorage stands in for the real
// Profile/Goal persistence that Milestone 1/2 add. Lets the clickable
// prototype carry onboarding answers into Home without a backend.
const STORAGE_KEY = "urpaisa.onboarding.goals"

export function saveSelectedGoals(goals: GoalOption[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
}

export function readSelectedGoals(): GoalOption[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
