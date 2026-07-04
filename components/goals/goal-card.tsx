"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2 } from "lucide-react"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GOAL_CATEGORY_LABEL } from "@/lib/coach"
import { sendJson } from "@/lib/client/api"
import { GoalForm } from "./goal-form"
import type { GoalDTO } from "./types"

// Milestone 4 — a single goal with real progress (PRD 04 §2) and inline
// edit/delete. Swaps to the edit form in place; delete refreshes the server
// component so ordering + the recommendation recompute.
export function GoalCard({ goal }: { goal: GoalDTO }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (editing) {
    return <GoalForm goal={goal} onDone={() => setEditing(false)} />
  }

  async function remove() {
    if (deleting) return
    setDeleting(true)
    const res = await sendJson("DELETE", `/api/goals/${goal.id}`)
    if (res.ok) {
      router.refresh()
    } else {
      setDeleting(false)
    }
  }

  const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 pb-2">
        <CardTitle>{goal.name}</CardTitle>
        {goal.category && <Badge variant="blue">{GOAL_CATEGORY_LABEL[goal.category]}</Badge>}
      </CardHeader>
      <CardContent className="gap-2">
        <p className="text-sm text-text-primary">
          {rupees(goal.currentSavings)} saved of {rupees(goal.targetAmount)}
        </p>
        <Progress value={goal.progressPercent} />
        <p className="text-xs text-text-muted">
          {goal.progressPercent}% complete
          {goal.deadline ? ` · Target: ${formatDate(goal.deadline)}` : ""}
        </p>
        <p className="text-sm text-text-primary">{goal.note}</p>
        {goal.remaining > 0 && goal.requiredMonthlyContribution != null && goal.requiredMonthlyContribution > 0 && (
          <p className="text-xs text-text-muted">
            Needs about {rupees(goal.requiredMonthlyContribution)}/month to stay on track.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          <Pencil /> Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={remove} disabled={deleting}>
          <Trash2 /> {deleting ? "Removing…" : "Delete"}
        </Button>
      </CardFooter>
    </Card>
  )
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`)
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" })
}
