"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { GOAL_CATEGORY_LABEL, type GoalCategoryValue } from "@/lib/coach"
import { sendJson } from "@/lib/client/api"
import { capture, EVENTS } from "@/lib/analytics/events"
import type { GoalDTO } from "./types"

// Milestone 4 — add / edit a goal (PRD 04 §2). One form for both: `goal`
// undefined creates (POST /api/goals), otherwise edits (PATCH /api/goals/:id).
// On save it refreshes the server component so the list + recommendation
// recompute from the new data.

const CATEGORY_OPTIONS = Object.entries(GOAL_CATEGORY_LABEL) as [GoalCategoryValue, string][]

export function GoalForm({ goal, onDone }: { goal?: GoalDTO; onDone: () => void }) {
  const router = useRouter()
  const isEdit = !!goal

  const [name, setName] = useState(goal?.name ?? "")
  const [category, setCategory] = useState<string>(goal?.category ?? "")
  const [targetAmount, setTargetAmount] = useState(goal ? String(goal.targetAmount) : "")
  const [currentSavings, setCurrentSavings] = useState(goal ? String(goal.currentSavings) : "")
  const [deadline, setDeadline] = useState(goal?.deadline ?? "")
  const [flexibility, setFlexibility] = useState(goal?.flexibility ?? "flexible")
  const [monthlyContribution, setMonthlyContribution] = useState(
    goal?.monthlyContribution != null ? String(goal.monthlyContribution) : ""
  )
  const [topPriority, setTopPriority] = useState(goal?.priority === 1)

  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setError(null)

    // Edit sends the full field set (nulls clear a value); create omits empties so
    // schema defaults apply.
    const body: Record<string, unknown> = { name, targetAmount, flexibility }
    body.currentSavings = currentSavings === "" ? (isEdit ? 0 : undefined) : currentSavings
    body.category = category === "" ? (isEdit ? null : undefined) : category
    body.deadline = deadline === "" ? (isEdit ? null : undefined) : deadline
    body.monthlyContribution =
      monthlyContribution === "" ? (isEdit ? null : undefined) : monthlyContribution
    body.priority = topPriority ? 1 : isEdit ? null : undefined

    const res = isEdit
      ? await sendJson("PATCH", `/api/goals/${goal!.id}`, body)
      : await sendJson("POST", "/api/goals", body)

    setSaving(false)
    if (!res.ok) {
      setError(res.error ?? "Couldn't save your goal. Please try again.")
      return
    }
    // Activation metric (PRD 00 §9) — a new goal being set, not an edit.
    if (!isEdit) capture(EVENTS.goalSet)
    router.refresh()
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-lg border border-border bg-surface-card p-4">
      <Field label="Goal name">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Emergency fund" required />
      </Field>

      <Field label="Goal type (optional)">
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Not sure yet</option>
          {CATEGORY_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Target (₹)">
          <Input
            type="number"
            inputMode="numeric"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="60000"
            required
          />
        </Field>
        <Field label="Saved so far (₹)">
          <Input
            type="number"
            inputMode="numeric"
            value={currentSavings}
            onChange={(e) => setCurrentSavings(e.target.value)}
            placeholder="0"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Target date (optional)">
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
        <Field label="Monthly plan (optional)">
          <Input
            type="number"
            inputMode="numeric"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(e.target.value)}
            placeholder="Auto"
          />
        </Field>
      </div>

      <Field label="Flexibility">
        <Select value={flexibility} onChange={(e) => setFlexibility(e.target.value as GoalDTO["flexibility"])}>
          <option value="flexible">Flexible — timing can move</option>
          <option value="fixed">Fixed — the date is firm</option>
        </Select>
      </Field>

      <label className="flex items-center gap-2 text-sm text-text-primary">
        <input
          type="checkbox"
          className="size-4 accent-mentor-blue"
          checked={topPriority}
          onChange={(e) => setTopPriority(e.target.checked)}
        />
        Make this my top priority
      </label>

      {error && <p className="text-sm text-zone-red">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="flex-1" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Add goal"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
