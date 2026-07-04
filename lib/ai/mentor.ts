import { AI_MODEL_REASONING, chatComplete } from "./client"
import { safetySystemPrompt } from "./safety"

// Milestone 7 — the grounded conversational answer (PRD 07 §1/§6) via
// AI_MODEL_REASONING. It answers the user's question using ONLY the snapshot and
// the deterministic draft, staying consistent with the draft's numbers and
// recommendation. Returns null on any failure so the caller keeps the draft
// (deterministic fallback, §7/§8). Never throws.

// The §6 answer rules, layered on top of the shared safety guardrail.
const MENTOR_RULES = `Answer the user's money question in 2–4 short sentences using ONLY the SNAPSHOT below.
- Stay consistent with the DRAFT answer's numbers, verdict, and recommendation — do not change any amount.
- Explain the tradeoff in plain language.
- If a needed detail is missing, say what you assumed rather than inventing it.
- End with exactly one next action.
- Do not claim certainty; these are estimates from what the user entered.`

interface MentorAiInput {
  question: string
  grounding: string
  draftAnswer: string
  draftNextAction: string
  tone?: string | null
}

export interface MentorAiResult {
  answer: string
  nextAction: string
}

export async function answerMentorQuestion(input: MentorAiInput): Promise<MentorAiResult | null> {
  const system = `${safetySystemPrompt(input.tone)}\n${MENTOR_RULES}`
  const user = [
    "SNAPSHOT (the user's real figures — the only facts you may use):",
    input.grounding,
    "",
    `QUESTION: ${input.question}`,
    "",
    "DRAFT (stay consistent with these facts and this recommendation):",
    `- answer: ${input.draftAnswer}`,
    `- next action: ${input.draftNextAction}`,
    "",
    'Reply with JSON only: {"answer": "...", "nextAction": "..."}',
  ].join("\n")

  const raw = await chatComplete({ system, user, model: AI_MODEL_REASONING, json: true })
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as { answer?: unknown; nextAction?: unknown }
    const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : ""
    const nextAction = typeof parsed.nextAction === "string" ? parsed.nextAction.trim() : ""
    if (!answer || !nextAction || answer.length > 800 || nextAction.length > 300) return null
    return { answer, nextAction }
  } catch {
    return null
  }
}
