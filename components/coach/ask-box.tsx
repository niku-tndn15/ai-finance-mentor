"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

// Milestone 7 — the "Ask UrPaisa" box on the Daily Mentor screen (M5 placeholder,
// now wired). Submitting hands the question to /coach, which auto-asks it against
// /api/mentor/ask. Kept as navigation (not a direct fetch) so the answer lands in
// the full chat view.
export function AskBox() {
  const router = useRouter()
  const [q, setQ] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const question = q.trim()
    router.push(question ? `/coach?q=${encodeURIComponent(question)}` : "/coach")
  }

  return (
    <form
      onSubmit={submit}
      className="flex items-center gap-2 rounded-lg border border-border bg-surface-card px-3 py-2"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ask UrPaisa a money question"
        aria-label="Ask UrPaisa a money question"
        className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
      />
      <button type="submit" aria-label="Ask" className="text-text-muted">
        <ArrowRight className="size-4" aria-hidden />
      </button>
    </form>
  )
}
