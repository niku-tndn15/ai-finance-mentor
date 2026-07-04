import { AI_MODEL_REASONING, chatComplete } from "./client"
import { safetySystemPrompt } from "./safety"

// Milestone 8 — optional warm rephrasing of the monthly reset headline (PRD 08
// §3 "help users plan the next month", mentor-style not a report). Returns null
// on any failure so the deterministic summary stands. Never throws.

export async function phraseResetSummary(
  summary: string,
  changeNextMonth: string,
  tone?: string | null
): Promise<string | null> {
  const system = `${safetySystemPrompt(tone)}
Rewrite this monthly money reset headline as ONE short, warm, forward-looking paragraph (2–3 sentences).
Keep every number and fact exactly. Do not add new facts, products, or advice.`
  const user = [
    `SUMMARY: ${summary}`,
    `PLANNED CHANGE: ${changeNextMonth}`,
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
