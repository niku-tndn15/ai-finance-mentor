import type { CoachingToneValue, HabitProfile } from "./types"

// Milestone 6 — adaptive tone selector (PRD 06 §6). The onboarding tone is the
// anchor; behaviour only nudges it on a clear signal, and never toward anything
// harsher (PRD 06 §7 / PRD 09 §4: no shame or pressure). Pure.

export interface ToneChoice {
  tone: CoachingToneValue
  // Whether behaviour changed the tone away from the user's chosen one.
  adapted: boolean
  reason: string
}

export function selectTone(profile: HabitProfile, baseTone?: CoachingToneValue | null): ToneChoice {
  const base: CoachingToneValue = baseTone ?? "friendly"

  const done = Object.values(profile.perType).reduce((n, s) => n + s.done, 0)
  const skip = Object.values(profile.perType).reduce((n, s) => n + s.skip, 0)
  const total = done + skip

  // Not enough signal yet — respect the chosen tone.
  if (total < 3) return { tone: base, adapted: false, reason: "Using your chosen coaching tone." }

  const completion = done / total

  // Following through on challenges → celebrate momentum.
  if (profile.perType.impulse.done >= 2 && base !== "motivational") {
    return { tone: "motivational", adapted: true, reason: "You respond well to small challenges." }
  }

  // A firm tone that isn't landing → soften rather than push harder.
  if (completion < 0.3 && (base === "strict" || base === "direct")) {
    return { tone: "calm", adapted: true, reason: "A gentler tone may land better right now." }
  }

  return { tone: base, adapted: false, reason: "Your chosen tone is working well." }
}
