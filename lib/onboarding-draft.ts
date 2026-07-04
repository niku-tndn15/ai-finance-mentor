import type { OnboardingInput } from "@/lib/validation/financial-model"

// Milestone 2 — carries the onboarding answers (user type, income type, coaching
// tone, primary goal) from the Onboarding screen to the Financial Setup screen,
// which submits them together in one POST /api/financial-model/setup. Onboarding
// runs after login, so a userId already exists; this is just transient wizard
// state on the client, cleared once setup succeeds. Dependency-free, same pattern
// as lib/onboarding-store.ts (the goal-interests store the prototype home reads).

const STORAGE_KEY = "urpaisa.onboarding.draft"

export type OnboardingDraft = Partial<OnboardingInput>

export function saveOnboardingDraft(draft: OnboardingDraft) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
}

export function readOnboardingDraft(): OnboardingDraft {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? (parsed as OnboardingDraft) : {}
  } catch {
    return {}
  }
}

export function clearOnboardingDraft() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
}
