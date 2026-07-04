import { AI_MODEL_FAST, chatComplete } from "./client"
import { safetySystemPrompt } from "./safety"

// Milestone 5 — the AI phrasing layer (PRD 05 §7, plan piece 7). Rewrites a
// nudge's action + reason into the user's chosen tone using AI_MODEL_FAST, wrapped
// in the safety guardrail. Returns null on ANY doubt (AI off, failure, malformed
// output) so the caller keeps the deterministic template — AI only ever makes a
// good nudge friendlier, it can never break or invent one.

interface PhraseInput {
  action: string
  reason: string
  expectedBenefit: string
}

export interface PhrasedNudge {
  action: string
  reason: string
}

export async function phraseNudge(nudge: PhraseInput, tone?: string | null): Promise<PhrasedNudge | null> {
  const system = safetySystemPrompt(tone)
  const user = [
    "Rewrite this money nudge to feel more natural and personal, keeping it very short.",
    "Keep the ACTION one sentence and the REASON one sentence.",
    "Keep every amount and fact identical. Do not add new facts, products, or advice.",
    "",
    `ACTION: ${nudge.action}`,
    `REASON: ${nudge.reason}`,
    `EXPECTED BENEFIT (context, do not repeat verbatim): ${nudge.expectedBenefit}`,
    "",
    'Reply with JSON only: {"action": "...", "reason": "..."}',
  ].join("\n")

  const raw = await chatComplete({ system, user, model: AI_MODEL_FAST, json: true })
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as { action?: unknown; reason?: unknown }
    const action = typeof parsed.action === "string" ? parsed.action.trim() : ""
    const reason = typeof parsed.reason === "string" ? parsed.reason.trim() : ""
    // Guard against empty or runaway output — if it's not sane, fall back.
    if (!action || !reason || action.length > 300 || reason.length > 300) return null
    return { action, reason }
  } catch {
    return null
  }
}
