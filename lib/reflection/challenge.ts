import type { FinancialModelInput } from "@/lib/financial-model"
import type { HabitProfile } from "@/lib/habit"

// Milestone 8 — habit challenge picker (PRD 08 §4/§5). Small, measurable, and
// chosen from real signals (§5 rules): skipped saving → tiny daily save;
// weekend overspend → weekend cap; many subscriptions → cleanup. Pure.

export interface Challenge {
  title: string
  detail: string
}

export function pickChallenge(profile: HabitProfile, model: FinancialModelInput): Challenge {
  const savingSkipped = profile.perType.payday.skip + profile.perType.goal.skip > 0 || profile.preferSmallerSaves
  const weekendSkipped = profile.perType.weekend.skip > 0

  // §5: user skips big savings nudges → small daily-save challenge.
  if (savingSkipped) {
    return {
      title: "Save ₹100 a day for 7 days",
      detail: "A tiny daily save builds the habit without the pressure of a big amount.",
    }
  }

  // §5: user overspends weekends → weekend limit challenge.
  if (weekendSkipped) {
    return {
      title: "Spend under ₹1,000 this weekend",
      detail: "A simple cap keeps the weekend fun without denting your plan.",
    }
  }

  // §5: subscriptions are high → cleanup challenge.
  if (model.subscriptions.length >= 3) {
    return {
      title: "Cancel one unused subscription",
      detail: "One cleanup saves you money every single month.",
    }
  }

  // Gentle default — a small, universally useful habit.
  return {
    title: "Wait 24 hours before a non-essential buy",
    detail: "A short pause turns most impulse buys into easy skips.",
  }
}
