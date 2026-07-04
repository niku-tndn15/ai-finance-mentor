import { AI_MODEL_REASONING, chatComplete } from "./client"
import { safetySystemPrompt } from "./safety"

// Milestone 8 — optional warm rephrasing of the weekly reflection summary (PRD 08
// §2 "feel like a mentor-style check-in, not a boring report"). Returns null on
// any failure so the deterministic summary stands. Never throws.

export async function phraseReflectionSummary(
  summary: string,
  pattern: string,
  tone?: string | null
): Promise<string | null> {
  const system = `${safetySystemPrompt(tone)}
Rewrite the weekly money check-in as ONE short, warm, encouraging paragraph (2–3 sentences).
Keep every number and fact exactly. Do not add new facts, products, or advice.`
  const user = [
    `SUMMARY: ${summary}`,
    `PATTERN: ${pattern}`,
    "",
    'Reply with JSON only: {"summary": "..."}',
  ].join("\n")

  const raw = await chatComplete({ system, user, model: AI_MODEL_REASONING, json: true })
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as { summary?: unknown }
    const out = typeof parsed.summary === "string" ? parsed.summary.trim() : ""
    if (!out || out.length > 600) return null
    return out
  } catch {
    return null
  }
}
