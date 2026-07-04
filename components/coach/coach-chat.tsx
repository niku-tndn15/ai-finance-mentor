"use client"

import { useEffect, useRef, useState } from "react"
import { Send } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AiAnswerCard } from "@/components/coach/ai-answer-card"
import { postJson } from "@/lib/client/api"
import { capture, EVENTS } from "@/lib/analytics/events"

// Milestone 7 — the real Ask UrPaisa chat. Posts to /api/mentor/ask and renders
// the grounded answer + one next action. The endpoint always returns a real
// answer (deterministic fallback if AI is unavailable), so the only failure path
// here is a network error.

const STARTERS = [
  "How much should I save this week?",
  "What should I fix first?",
  "Can I spend ₹2,000 today?",
  "Why am I not saving enough?",
  "Should I pay debt or save first?",
  "How do I reduce spending?",
]

interface AnswerData {
  answer: string
  nextAction: string
  lowConfidence?: boolean
}

type Turn =
  | { role: "user"; text: string }
  | { role: "assistant"; data: AnswerData }
  | { role: "error"; text: string }

export function CoachChat({ initialQuestion }: { initialQuestion?: string }) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const askedInitial = useRef(false)

  async function ask(question: string) {
    const q = question.trim()
    if (!q || loading) return
    setInput("")
    setTurns((t) => [...t, { role: "user", text: q }])
    setLoading(true)
    capture(EVENTS.questionAsked)

    const res = await postJson<AnswerData & { error?: string }>("/api/mentor/ask", { question: q })
    setLoading(false)

    if (!res.ok) {
      setTurns((t) => [
        ...t,
        { role: "error", text: res.error ?? "UrPaisa couldn't answer just now. Please try again." },
      ])
      return
    }
    setTurns((t) => [
      ...t,
      { role: "assistant", data: { answer: res.data.answer, nextAction: res.data.nextAction, lowConfidence: res.data.lowConfidence } },
    ])
  }

  // Auto-ask a question passed in from the home "Ask UrPaisa" box (?q=…).
  useEffect(() => {
    if (initialQuestion && !askedInitial.current) {
      askedInitial.current = true
      ask(initialQuestion)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion])

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-4">
      <h1 className="text-lg font-semibold text-text-primary">Ask UrPaisa</h1>

      {turns.length === 0 && !loading && (
        <div className="flex flex-wrap gap-2">
          {STARTERS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => ask(chip)}
              className="rounded-full border border-border bg-surface-card px-3 py-1.5 text-xs font-medium text-text-primary"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {turns.map((turn, i) =>
          turn.role === "user" ? (
            <div key={i} className="ml-auto max-w-[80%] rounded-lg bg-mentor-blue px-3 py-2 text-sm text-white">
              {turn.text}
            </div>
          ) : turn.role === "assistant" ? (
            <AiAnswerCard key={i} answer={turn.data.answer} nextAction={turn.data.nextAction} />
          ) : (
            <p key={i} className="rounded-lg bg-zone-red-bg px-3 py-2 text-sm text-zone-red">
              {turn.text}
            </p>
          )
        )}
        {loading && <p className="text-sm text-text-muted">UrPaisa is thinking…</p>}
      </div>

      <form
        className="mt-auto flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a money question..."
          aria-label="Ask UrPaisa"
          disabled={loading}
        />
        <Button type="submit" size="icon" aria-label="Send" disabled={loading}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  )
}
