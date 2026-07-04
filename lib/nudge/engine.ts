import { ALL_BUILDERS } from "./templates"
import type { NudgeCandidate, NudgeContext, ScoredNudge } from "./types"

// Milestone 5 — the scoring + selection core (PRD 05 §2 / §4). Pure.

// Score combines all three §2 factors — urgency, readiness, impact — into one
// number. Urgency is weighted so that a single step of §4 trigger priority (10
// points) always outweighs the largest possible readiness+impact contribution
// (5 + 3 = 8). That means selection reproduces the §4 ordering *exactly*, while
// readiness and impact still (a) break ties between equal-urgency candidates and
// (b) genuinely feed the score, satisfying the §8 "uses urgency, readiness, and
// impact" criterion.
const URGENCY_WEIGHT = 10
const IMPACT_WEIGHT = 5
const READINESS_WEIGHT = 3

export function scoreNudge(candidate: NudgeCandidate, ctx: NudgeContext): ScoredNudge {
  // M6 will supply learned readiness per type via readinessHint; until then the
  // template heuristic stands (PRD 05 §2 note).
  const readiness = ctx.readinessHint?.[candidate.type] ?? candidate.readiness
  const score =
    (9 - candidate.urgencyRank) * URGENCY_WEIGHT + candidate.impact * IMPACT_WEIGHT + readiness * READINESS_WEIGHT
  return { ...candidate, readiness, score }
}

export function generateCandidates(ctx: NudgeContext): ScoredNudge[] {
  const suppressed = new Set(ctx.suppressedTypes ?? [])
  return ALL_BUILDERS.map((build) => build(ctx))
    .filter((c): c is NudgeCandidate => c !== null)
    // Drop repeatedly-skipped soft types so a different nudge surfaces (PRD 06 §3).
    // The habit model only ever suppresses soft types, so essentials still show.
    .filter((c) => !suppressed.has(c.type))
    .map((c) => scoreNudge(c, ctx))
    .sort((a, b) => b.score - a.score)
}

// The single primary nudge for the day (PRD 05 §6 "one primary nudge per day").
// Null only if nothing applies, which in practice can't happen — the impulse
// habit-challenge template always produces a candidate.
export function selectNudge(ctx: NudgeContext): ScoredNudge | null {
  return generateCandidates(ctx)[0] ?? null
}
