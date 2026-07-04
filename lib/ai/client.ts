// Milestone 5 — the single OpenAI call site (TECH_STACK.md §5). Everything goes
// through here so the safety rules and the graceful-degradation contract live in
// one place: this NEVER throws and returns null on any problem (missing/placeholder
// key, network error, timeout, bad response), so every caller can treat AI as
// optional and fall back to its deterministic template (PRD 05 §8, PRD 09 §7).

const OPENAI_URL = "https://api.openai.com/v1/chat/completions"
const TIMEOUT_MS = 8000

// The .env.example ships a "sk-xxxx…" placeholder; treat that (or a missing key)
// as "no AI configured" so we don't fire doomed requests on every render.
function apiKey(): string | null {
  const key = process.env.OPENAI_API_KEY
  if (!key || key.includes("xxxx")) return null
  return key
}

export function isAiConfigured(): boolean {
  return apiKey() !== null
}

export const AI_MODEL_FAST = process.env.AI_MODEL_FAST || "gpt-4o-mini"
export const AI_MODEL_REASONING = process.env.AI_MODEL_REASONING || "gpt-4o"

interface ChatOptions {
  system: string
  user: string
  model: string
  // Ask the model for a strict JSON object when true.
  json?: boolean
}

// Returns the assistant message content, or null on any failure.
export async function chatComplete({ system, user, model, json }: ChatOptions): Promise<string | null> {
  const key = apiKey()
  if (!key) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    return data.choices?.[0]?.message?.content ?? null
  } catch {
    // Timeout / network / abort — degrade silently to the caller's fallback.
    return null
  } finally {
    clearTimeout(timeout)
  }
}
