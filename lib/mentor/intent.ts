import type { MentorIntent } from "./types"

// Milestone 7 — lightweight intent detection (PRD 07 §2). Keyword heuristics, not
// AI: this routes a question to the right deterministic base answer so the mentor
// works even when AI is unavailable. Pure.

// Pull the first rupee amount out of a question ("₹4,000", "4000", "4k", "2 lakh").
export function parseAmount(question: string): number | null {
  const m = question.match(/(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|lakh|lac|l)?\b/i)
  if (!m) return null
  let n = parseFloat(m[1].replace(/,/g, ""))
  if (Number.isNaN(n)) return null
  const unit = (m[2] || "").toLowerCase()
  if (unit === "k" || unit === "thousand") n *= 1000
  else if (unit === "lakh" || unit === "lac" || unit === "l") n *= 100000
  return Math.round(n)
}

export interface DetectedIntent {
  intent: MentorIntent
  amount: number | null
}

export function detectIntent(question: string): DetectedIntent {
  const q = question.toLowerCase()
  const amount = parseAmount(question)

  const asksAffordability =
    /\b(afford|can i (spend|buy)|should i (buy|spend)|worth buying|ok to (buy|spend))\b/.test(q) ||
    (amount !== null && /\b(spend|buy|buying|shopping|purchase|cost|get)\b/.test(q))
  if (asksAffordability) return { intent: "affordability", amount }

  if (/\bhow much.*sav|sav.*(this week|per week|weekly|each week)\b/.test(q))
    return { intent: "save_this_week", amount: null }

  if (/\b(fix first|first thing|one thing|what should i (do|fix|focus)|priorit)\b/.test(q))
    return { intent: "fix_first", amount: null }

  if (/\bwhy.*(not|n['’]?t|isn['’]?t).*sav/.test(q)) return { intent: "why_not_saving", amount: null }

  if (
    /\bdebt\b.*\b(or|vs|versus|before|first)\b.*\bsav/.test(q) ||
    /\bsav\w*\b.*\b(or|vs|versus|before|first)\b.*\bdebt\b/.test(q)
  )
    return { intent: "save_vs_debt", amount: null }

  if (/\b(reduce|cut|lower|less|control).*(spend)|spend less\b/.test(q))
    return { intent: "reduce_spending", amount: null }

  return { intent: "unknown", amount: null }
}
